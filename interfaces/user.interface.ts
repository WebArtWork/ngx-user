import { CrudDocument } from "wacom";

export interface User extends CrudDocument {
	is: Record<string, boolean>;
	email: string;
}
