import { Component } from '@angular/core';
import { User as OldUser } from 'src/app/core/interfaces/user';
import { UserService } from 'src/app/core/services/user.service';
import { FormService } from 'src/app/modules/form/form.service';
import { FormInterface } from 'src/app/modules/form/interfaces/form.interface';
import { TranslateService } from 'src/app/modules/translate/translate.service';
import { AlertService, CoreService } from 'wacom';
import { NewuserserviceService } from '../clients/newuserservice.service';
import { User } from '../../interfaces/user.interface';

@Component({
	selector: 'app-users',
	templateUrl: './users.component.html',
	styleUrls: ['./users.component.scss']
})
export class UsersComponent {
	form: FormInterface = this._form.getForm('user');

	config = {
		create: () => {
			this._form
				.modal<User>(this.form, {
					label: 'Create',
					click: (created: unknown, close: () => void) => {
						this._us.create(
							created as User,
							'User has been created',
							close.bind(this)
						);
					}
				})
				.then(this._us.create.bind(this));
		},
		update: (doc: User) => {
			this._form.modal<User>(this.form, [], doc).then((updated: User) => {
				this._core.copy(updated, doc);
				this._us.update(doc, 'User has been updated');
			});
		},
		delete: (user: User) => {
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
						callback: () => {
							this._us.delete(
								user,
								'User has been deleted',
								() => {
									// this.setUsers();
								},
								() => {},
								{
									name: 'admin'
								}
							);
						}
					}
				]
			});
		}
	};

	columns = ['name', 'email'];

	constructor(
		private _us: NewuserserviceService,
		private _form: FormService,
		public us: UserService,
		private _alert: AlertService,
		private _core: CoreService,
		private _translate: TranslateService
	) {
		for (const role of this.us.roles) {
			this.columns.push(role);
		}
	}
}
