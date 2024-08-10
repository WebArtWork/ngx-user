import { Injectable } from '@angular/core';
import {
	AlertService,
	CoreService,
	HttpService,
	StoreService,
	CrudService
} from 'wacom';
import { User } from '../interfaces/user.interface';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable({
	providedIn: 'root'
})
export class UserService extends CrudService<User> {
	private http: HttpService;
	private store: StoreService;
	private alert: AlertService;
	private core: CoreService;
	roles = (environment as unknown as { roles: string[] }).roles || ['admin'];
	mode = '';
	users: User[] = [];
	user: User = localStorage.getItem('waw_user')
		? JSON.parse(localStorage.getItem('waw_user') as string)
		: this.new();
	constructor(
		_http: HttpService,
		_store: StoreService,
		_alert: AlertService,
		_core: CoreService,
		private _router: Router
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

		this.store = _store;
		this.http = _http;
		this.alert = _alert;
		this.core = _core;
		if (this.http.header('token')) {
			this.fetch({}, { name: 'me' }).subscribe(this.setUser.bind(this));
			this.load();
		}

		this.store.get('mode', (mode) => {
			if (mode) {
				this.setMode(mode);
			}
		});
	}

	load(): void {
		this.get().subscribe((users: User[]) => this.users.push(...users));
	}

	setMode(mode = ''): void {
		if (mode) {
			this.store.set('mode', mode);

			(document.body.parentNode as HTMLElement).classList.add(mode);
		} else {
			this.store.remove('mode');

			(document.body.parentNode as HTMLElement).classList.remove('dark');
		}

		this.mode = mode;
	}

	setUser(user: User): void {
		this.user = user;
		localStorage.setItem('waw_user', JSON.stringify(user));
		this.core.complete('us.user');
	}

	role(role: string): boolean {
		return !!(this.user?.is || {})[role];
	}

	updateMe(): void {
		this.setUser(this.user);
		this.update(this.user);
	}

	updateMeAfterWhile(): void {
		this.setUser(this.user);
		this.updateAfterWhile(this.user);
	}

	private _changingPassword = false;
	changePassword(oldPass: string, newPass: string): void {
		if (this._changingPassword) return;
		this._changingPassword = true;
		this.http.post(
			'/api/user/changePassword',
			{
				newPass: newPass,
				oldPass: oldPass
			},
			(resp: boolean) => {
				this._changingPassword = false;
				if (resp) {
					this.alert.info({
						text: 'Successfully changed password'
					});
				} else {
					this.alert.error({
						text: 'Incorrect current password'
					});
				}
			}
		);
	}

	logout(): void {
		this.user = this.new();

		localStorage.removeItem('waw_user');

		this._router.navigateByUrl('/sign');

		this.http.remove('token');

		setTimeout(() => {
			location.reload();
		}, 100);
	}

	updateAdmin(user: User): void {
		this.update(user, {
			name: 'admin'
		});
	}

	deleteAdmin(user: User): void {
		this.delete(user, {
			name: 'admin'
		});
	}
}
