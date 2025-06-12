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
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class UserService extends CrudService<User> {
	readonly url = environment.url;

	get thumb(): string {
		return !this.user.thumb ||
			this.user.thumb.includes('assets/default.png')
			? 'assets/default.png'
			: this.url + this.user.thumb;
	}

	roles = (
		(environment as unknown as { roles: string[] }).roles || []
	).concat(['admin']);

	employees = (environment as unknown as { roles: string[] }).roles || [];

	mode = 'dark';

	modes = (
		(environment as unknown as { modes: string[] }).modes || []
	).concat(['dark', 'white']);

	users: User[] = this.getDocs();

	user: User = localStorage.getItem('waw_user')
		? JSON.parse(localStorage.getItem('waw_user') as string)
		: this.new();

	usersByRole: Record<string, User[]> = {};

	constructor(
		private _http: HttpService,
		private _store: StoreService,
		private _alert: AlertService,
		private _core: CoreService,
		private _router: Router
	) {
		super({
			name: 'user',
			replace: (user) => {
				user.roles = [];

				user.data = user.data || {};

				for (const field of (
					environment as unknown as { userFields: string[] }
				).userFields || []) {
					user.data[field] = user.data[field] || {};
				}

				for (const role of this.roles) {
					if (user.is[role]) {
						user.roles.push(role);
					}
				}

				return user;
			}
		});

		this.filteredDocuments(this.usersByRole, 'roles');

		this.fetch({}, { name: 'me' }).subscribe((user) => {
			if (user) {
				if (
					!localStorage.getItem('waw_user') &&
					this._router.url === '/sign'
				) {
					this._router.navigateByUrl('/profile');
				}

				this.setUser(user);
			} else if (localStorage.getItem('waw_user')) {
				this.logout();
			}
		});

		this.get({
			query: environment.appId ? 'appId=' + environment.appId : ''
		});

		this._store.get('mode', (mode) => {
			if (mode) {
				this.setMode(mode);
			} else {
				this.setMode('dark');
			}
		});
	}

	setMode(mode = 'white'): void {
		if (mode === 'white') {
			this._store.remove('mode');

			for (const localmode of this.modes) {
				(document.body.parentNode as HTMLElement).classList.remove(
					localmode
				);
			}
		} else {
			this._store.set('mode', mode);

			(document.body.parentNode as HTMLElement).classList.add(mode);
		}

		this.mode = mode;
	}

	setUser(user: User): void {
		this.user = user;

		localStorage.setItem('waw_user', JSON.stringify(user));

		this._core.complete('us.user');
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

	changePassword(oldPass: string, newPass: string): void {
		if (this._changingPassword) return;

		this._changingPassword = true;

		this._http.post(
			'/api/user/changePassword',
			{
				newPass: newPass,
				oldPass: oldPass
			},
			(resp: boolean) => {
				this._changingPassword = false;

				if (resp) {
					this._alert.info({
						text: 'Successfully changed password'
					});
				} else {
					this._alert.error({
						text: 'Incorrect current password'
					});
				}
			}
		);
	}

	logout(): void {
		this.user = this.new();

		localStorage.removeItem('waw_user');

		this._http.remove('token');

		this._http.get('/api/user/logout');

		this._router.navigateByUrl('/sign');

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

	private _changingPassword = false;
}
