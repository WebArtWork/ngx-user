import { Injectable } from '@angular/core';
import { MongoService, AlertService } from 'wacom';

export interface User {
	_id: string;
	name: string;
	description: string;
}

@Injectable({
	providedIn: 'root'
})
export class UserService {
	users: User[] = [];

	_users: any = {};

	new(): User {
		return {
			_id: '',
			name: '',
			description: ''
		}
	}

	constructor(
		private mongo: MongoService,
		private alert: AlertService
	) {
		this.users = mongo.get('user', {}, (arr: any, obj: any) => {
			this._users = obj;
		});
	}

	create(
		user: User = this.new(),
		callback = (created: User) => {},
		text = 'user has been created.'
	) {
		if (user._id) {
			this.save(user);
		} else {
			this.mongo.create('user', user, (created: User) => {
				callback(created);
				this.alert.show({ text });
			});
		}
	}

	doc(userId: string): User {
		if(!this._users[userId]){
			this._users[userId] = this.mongo.fetch('user', {
				query: {
					_id: userId
				}
			});
		}
		return this._users[userId];
	}

	update(
		user: User,
		callback = (created: User) => {},
		text = 'user has been updated.'
	): void {
		this.mongo.afterWhile(user, ()=> {
			this.save(user, callback, text);
		});
	}

	save(
		user: User,
		callback = (created: User) => {},
		text = 'user has been updated.'
	): void {
		this.mongo.update('user', user, () => {
			if(text) this.alert.show({ text, unique: user });
		});
	}

	delete(
		user: User,
		callback = (created: User) => {},
		text = 'user has been deleted.'
	): void {
		this.mongo.delete('user', user, () => {
			if(text) this.alert.show({ text });
		});
	}
}
