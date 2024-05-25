import { CrudDocument } from "../pages/clients/newuserservice.service";

export interface User extends CrudDocument {
	is: Record<string, boolean>;
}
