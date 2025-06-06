export const portfolioFormComponents = {
	formId: 'portfolio',
	title: 'Portfolio',
	components: [
		{
			name: 'Text',
			key: 'name',
			focused: true,
			fields: [
				{
					name: 'Placeholder',
					value: 'fill portfolio title',
				},
				{
					name: 'Label',
					value: 'Title',
				}
			]
		},
		{
			name: 'Text',
			key: 'description',
			fields: [
				{
					name: 'Placeholder',
					value: 'fill portfolio description',
				},
				{
					name: 'Label',
					value: 'Description',
				}
			]
		}
	]
}
