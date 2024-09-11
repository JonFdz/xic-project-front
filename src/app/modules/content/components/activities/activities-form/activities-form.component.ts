import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

import { ActivitiesService } from '@services/activities.service';
import { DialogComponent } from '@sharedcontent/dialog/dialog.component';

@Component({
	selector: 'app-activities-form',
	standalone: true,
	imports: [ReactiveFormsModule, CommonModule],
	templateUrl: './activities-form.component.html',
	styleUrl: './activities-form.component.scss'
})
export class ActivitiesFormComponent implements OnInit {
	activitiesForm: FormGroup;
	activityId: number | null = null;

	constructor(
		private fb: FormBuilder,
		private activitiesService: ActivitiesService,
		private router: Router,
		private route: ActivatedRoute,
		private dialog: MatDialog
	) {
		this.activitiesForm = this.fb.group({
			activity_name: ['', Validators.required],
			instructor: ['', Validators.required],
			day: ['', Validators.required],
			hour: ['', Validators.required],
			category: [''],
			description: ['']
		});
	}

	ngOnInit(): void {
		const stringActivityId = this.route.snapshot.paramMap.get('id');
		this.activityId = stringActivityId ? +stringActivityId : null;
		if (this.activityId) {
			this.loadActivityData(this.activityId);
		}
	}

	loadActivityData(activityId: number): void {
		this.activitiesService.getActivity(activityId).subscribe((activity: any) => {
			this.activitiesForm.patchValue(activity);
		});
	}

	resetForm(): void {
		this.activitiesForm.reset();
	}

	openDialog(component: string, status: 'success' | 'error', message: string): void {
		this.dialog.open(DialogComponent, {
			data: {component, status, message }
		});
		this.dialog.afterAllClosed.subscribe(() => {
			window.scrollTo(0, 0);
		});
	}

	onSubmit(): void {
		if (this.activitiesForm.valid) {
			if (this.activityId) {
				this.activitiesService.updateActivity(this.activityId, this.activitiesForm.value).subscribe(() => {
					this.openDialog('Status', 'success', 'Intercambio actualizado correctamente');
					console.log('Activity updated');
					this.router.navigate(['activities/']);
				});
			} else {
				this.activitiesService.createActivity(this.activitiesForm.value).subscribe(() => {
					this.openDialog('Status', 'success', 'Intercambio creado correctamente');
					console.log('Activity created');
					this.activitiesForm.reset();
					this.router.navigate(['activities/']);
				});
			}
		} else {
			this.openDialog('Status', 'error', 'Formulario inválido');
			console.log('Invalid form');
		}
	}
}
