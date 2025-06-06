import {
	SimpleChanges,
	EventEmitter,
	Component,
	OnChanges,
	Output,
	Input,
} from '@angular/core';
import { SelectModule } from 'src/app/core/modules/select/select.module';
import { PortfolioService } from '../../services/portfolio.service';
import { Portfolio } from '../../interfaces/portfolio.interface';

@Component({
	selector: 'portfolio-selector',
	templateUrl: './portfolio-selector.component.html',
	styleUrls: ['./portfolio-selector.component.scss'],
	imports: [SelectModule],
})
export class PortfolioSelectorComponent implements OnChanges {
	@Input() value: string;

	@Output() wChange = new EventEmitter();

	get items(): Portfolio[] {
		return this._portfolioService.portfolios;
	}

	constructor(private _portfolioService: PortfolioService) {}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['value'] && !changes['value'].firstChange) {
			this.value = changes['value'].currentValue;
		}
	}
}
