import { CrudDocument } from 'wacom';

export interface User extends CrudDocument {
	data: Record<string, unknown>;
	is: Record<string, boolean>;
	roles: string[];
	name: string;
	phone: string;
	bio: string;
	email: string;
	thumb: string;
}
