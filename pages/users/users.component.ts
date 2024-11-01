import { Component } from '@angular/core';
import { FormService } from 'src/app/core/modules/form/form.service';
import { FormInterface } from 'src/app/core/modules/form/interfaces/form.interface';
import { TranslateService } from 'src/app/core/modules/translate/translate.service';
import { AlertService, CoreService } from 'wacom';
import { User } from '../../interfaces/user.interface';
import { UserService } from '../../services/user.service';

@Component({
	selector: 'app-users',
	templateUrl: './users.component.html',
	styleUrls: ['./users.component.scss']
})
export class UsersComponent {
	form: FormInterface = this._form.getForm('user');

	config = {
		create: (): void => {
			this._form
				.modal<User>(this.form, {
					label: 'Create',
					click: (created: unknown, close: () => void) => {
						this._us.create(created as User, {
							alert: 'User has been created',
							callback: close.bind(this)
						});
					}
				})
				.then(this._us.create.bind(this));
		},
		update: (doc: User): void => {
			this._form.modal<User>(this.form, [], doc).then((updated: User) => {
				this._core.copy(updated, doc);

				this._us.update(doc, {
					alert: 'User has been updated'
				});
			});
		},
		delete: (user: User): void => {
			this._alert.question({
				text: this._translate.translate(
					'Common.Are you sure you want to delete this user?'
				),
				buttons: [
					{
						text: this._translate.translate('Common.No')
					},
					{
						text: this._translate.translate('Common.Yes'),
						callback: (): void => {
							this._us.delete(user, {
								name: 'admin',
								alert: 'User has been deleted',
								callback: () => {
									// this.setUsers();
								}
							});
						}
					}
				]
			});
		}
	};

	columns = ['name', 'email'];

	get roles(): string[] {
		return this._us.roles;
	}

	get users(): User[] {
		return this._us.users;
	}

	constructor(
		private _translate: TranslateService,
		private _us: UserService,
		private _form: FormService,
		private _alert: AlertService,
		private _core: CoreService
	) {
		for (const role of this._us.roles) {
			this.columns.push(role);
		}
	}

	update(user: User): void {
		this._us.updateAdmin(user);
	}
}
