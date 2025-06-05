import { FormComponentInterface } from 'src/app/core/modules/form/interfaces/component.interface';
import { environment } from 'src/environments/environment';

export const userFormComponents = {
	formId: 'user',
	title: 'Profile Settings',
	components: [
		{
			name: 'Text',
			key: 'name',
			focused: true,
			fields: [
				{
					name: 'Placeholder',
					value: 'Enter your name'
				},
				{
					name: 'Label',
					value: 'Name'
				}
			]
		},
		{
			name: 'Text',
			key: 'phone',
			fields: [
				{
					name: 'Placeholder',
					value: 'Enter your phone'
				},
				{
					name: 'Label',
					value: 'Phone'
				}
			]
		},
		{
			name: 'Text',
			key: 'bio',
			fields: [
				{
					name: 'Placeholder',
					value: 'Enter your bio'
				},
				{
					name: 'Label',
					value: 'Bio'
				},
				{
					name: 'Textarea',
					value: true
				}
			]
		},
		...((
			environment as unknown as {
				userForm?: FormComponentInterface[];
			}
		).userForm || [])
	]
};
