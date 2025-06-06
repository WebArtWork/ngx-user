import { Injectable } from '@angular/core';
import { Portfolio } from '../interfaces/portfolio.interface';
import { CrudService } from 'wacom';

@Injectable({
	providedIn: 'root',
})
export class PortfolioService extends CrudService<Portfolio> {
	constructor() {
		super({
			name: 'portfolio',
		});
	}
}
