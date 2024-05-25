import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AlertService, CoreService, HttpService, StoreService } from 'wacom';
import { User } from '../../interfaces/user.interface';

interface CrudOptions {
	name?: string;
}

interface CrudConfig<Document> {
	name: string;
	_id?: string;
	replace?: (doc: Document) => void;
}

export interface CrudDocument {
	_id: string;
	__created: boolean;
	__modified: boolean;
}

export default abstract class CrudService<Document extends CrudDocument> {
	/*
		doc should be able to:
		1) stored locally
		2) add sockets
		3) have temporary id {MODULE_Date.now()}
		4) work as MongoService via read function
	*/
	private _url = '/api/';
	_id(doc: Document): string {
		return (doc as unknown as Record<string, unknown>)[
			this._config._id || '_id'
		]?.toString() as string;
	}
	new(): CrudDocument {
		return {
			_id: Date.now().toString(),
			__created: false,
			__modified: false
		};
	}
	constructor(
		private _config: CrudConfig<Document>,
		private _http: HttpService,
		private _store: StoreService,
		private _alert: AlertService,
		private _core: CoreService
	) {
		this._url += this._config.name;
		this._store.getJson('docs_' + this._config.name, (docs) => {
			if (docs) {
				this.docs = docs;
			}
		});
	}
	private docs: Document[] = [];
	addDoc(doc: Document) {
		if (typeof this._config.replace === 'function') {
			this._config.replace(doc);
		}
		const docs = this.docs.map((d) => this._id(d));
		if (docs.includes(this._id(doc))) {
			const document = this.docs.find(
				(d) => this._id(d) === this._id(doc)
			);
			if (document) {
				this._core.copy(doc, document);
			}
		} else {
			this.docs.push(doc);
		}
		// review arrays
		this.setDocs();
	}
	setDocs() {
		this._store.setJson('docs_' + this._config.name, this.docs);
	}
	private _names: string[] = [];
	private _configuredDocs: Record<string, unknown> = {};
	private _docsConfiguration: Record<
		string,
		(doc: Document, container: unknown) => void
	> = {};
	private _docsReset: Record<string, () => unknown> = {};
	configDocs(
		name: string,
		config: (doc: Document, container: unknown) => void,
		reset: () => unknown
	) {
		if (this._names.includes(name)) {
			return this.getConfigedDocs(name);;
		}
		this._names.push(name);
		this._docsReset[name] = reset;
		this._docsConfiguration[name] = config;
		this.reconfigureDocs(name);
		return this.getConfigedDocs(name);
	}
	getConfigedDocs(name: string) {
		return this._configuredDocs[name];
	}
	reconfigureDocs(name: string = '') {
		const names = name ? [name] : this._names;
		for (const _name of names) {
			this._configuredDocs[_name] = this._docsReset[_name]();
			for (const doc of this.docs) {
				this._docsConfiguration[_name](
					doc,
					this._configuredDocs[_name]
				);
			}
		}
	}
	private _perPage = 20;
	setPerPage(_perPage: number) {
		this._perPage = _perPage;
	}
	get(
		page: number | undefined,
		callback: (resp: Document[]) => void = () => {}
	): Observable<Document[]> {
		if (typeof page === 'number') {
			const obs = this._http.get(
				`${this._url}/get?skip=${this._perPage * (page - 1)}&limit=${
					this._perPage
				}`
			);
			obs.subscribe((resp: Document[]) => {
				for (const doc of resp) {
					this.addDoc(doc);
				}
				callback(resp);
			});
			return obs;
		} else {
			const obs = this._http.get(`${this._url}/get`);
			obs.subscribe((resp: Document[]) => {
				for (const doc of resp) {
					this.addDoc(doc);
				}
				callback(resp);
			});
			return obs;
		}
	}

	create(
		doc: Document,
		text: string = '',
		callback: (resp: Document) => void = () => {},
		errCallback: (resp: unknown) => void = () => {},
		options: CrudOptions = {}
	): Observable<Document> | void {
		if (doc.__created) {
			return;
		}
		doc.__created = true;
		const obs = this._http.post(
			this._url + '/create' + (options.name || ''),
			doc
		);
		obs.subscribe(
			(resp: Document) => {
				if (typeof resp === 'object') {
					this._core.copy(resp, doc);
					this.addDoc(doc);
					callback(doc);
					this.reconfigureDocs();
					if (text) {
						this._alert.show({
							unique: this._config.name + 'create',
							text
						});
					}
				} else {
					doc.__created = false;
					errCallback(resp);
				}
			},
			(err: unknown) => {
				doc.__created = false;
				errCallback(err);
			}
		);
		return obs;
	}

	updateAfterWhile(
		doc: Document,
		text: string = '',
		callback: (resp: Document) => void = () => {},
		errCallback: (resp: unknown) => void = () => {},
		options: CrudOptions = {}
	): void {
		doc.__modified = true;
		this._core.afterWhile(this._id(doc), () => {
			this.update(doc, text, callback, errCallback, options);
		});
	}
	update(
		doc: Document,
		text: string = '',
		callback: (resp: Document) => void = () => {},
		errCallback: (resp: unknown) => void = () => {},
		options: CrudOptions = {}
	): Observable<Document> {
		doc.__modified = true;
		const obs = this._http.post(
			this._url + '/update' + (options.name || ''),
			doc
		);
		obs.subscribe((resp: Document) => {
			if (typeof resp === 'object') {
				doc.__modified = false;
				this._core.copy(resp, doc);
				callback(doc);
				if (text) {
					this._alert.show({
						text,
						unique: this._config.name + 'update'
					});
				}
			} else {
				errCallback(resp);
			}
		}, errCallback);
		return obs;
	}

	delete(
		doc: Document,
		text: string = '',
		callback: () => void = () => {},
		errCallback: () => void = () => {},
		options: CrudOptions = {}
	): Observable<Document> {
		const obs = this._http.post(
			this._url + '/delete' + (options.name || ''),
			doc
		);
		obs.subscribe((resp: boolean) => {
			if (resp) {
				this.docs = this.docs.filter(
					(d) => this._id(d) !== this._id(doc)
				);
				this.setDocs();
				this.reconfigureDocs();
				callback();
				if (text) {
					this._alert.show({
						text,
						unique: this._config.name + 'delete'
					});
				}
			} else {
				errCallback();
			}
		}, errCallback);
		return obs;
	}
}


@Injectable({
	providedIn: 'root'
})
export class NewuserserviceService extends CrudService<User> {
	constructor(
		_http: HttpService,
		_store: StoreService,
		_alert: AlertService,
		_core: CoreService
	) {
		super(
			{
				name: 'user'
			},
			_http,
			_store,
			_alert,
			_core
		);
	}

	mode = '';

	set(mode = ''): void {
		if (mode) {
			// this._store.set('mode', mode);

			(document.body.parentNode as HTMLElement).classList.add(mode);
		} else {
			// this._store.remove('mode');

			(document.body.parentNode as HTMLElement).classList.remove('dark');
		}

		this.mode = mode;
	}

	user: User = localStorage.getItem('waw_user')
		? JSON.parse(localStorage.getItem('waw_user') as string)
		: this.new();

	roles = [
		'admin',
		'operator',
		'agent',
		'owner'
	];

	role(role: string): boolean {
		return !!this.user.is[role];
	}
}
