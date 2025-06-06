import { CrudDocument } from 'wacom';

export interface Portfolio extends CrudDocument {
	name: string;
	description: string;
}
