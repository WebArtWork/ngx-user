import { Injectable } from '@angular/core';
import { AlertService, CoreService, HttpService, StoreService, CrudService } from 'wacom';
import { User } from '../interfaces/user.interface';

@Injectable({
	providedIn: 'root'
})
export class UserService extends CrudService<User> {
	private store: StoreService;
	roles = ['admin', 'operator', 'agent', 'owner'];
	mode = '';
	users: User[] = [];
	user: User = localStorage.getItem('waw_user')
		? JSON.parse(localStorage.getItem('waw_user') as string)
		: this.new();
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

		this.store = _store;
		this.get().subscribe((users: User[]) => this.users.push(...users));
		this.fetch({}, { name: 'me' }).subscribe(this.setUser.bind(this));

		this.store.get('mode', (mode) => {
			if (mode) {
				this.setMode(mode);
			}
		});
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
	}

	role(role: string): boolean {
		return !!this.user.is[role];
	}

	updateAdmin(user: User): void {
		this.update(user, {
			name: 'admin'
		});
	}
}
