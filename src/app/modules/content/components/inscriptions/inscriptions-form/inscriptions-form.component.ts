import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, merge, throwError } from 'rxjs';

import { UsersService } from '@services/users.service';
import { ActivitiesService } from '@services/activities.service';
import { InscriptionsService } from '@services/inscriptions.service';

import { User } from '@models/user.model';
import { Activity } from '@models/activity.model';
import { Inscription } from '@models/inscription.model';
import { DialogComponent } from '@sharedcontent/dialog/dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
	selector: 'app-inscriptions-form',
	templateUrl: './inscriptions-form.component.html',
	styleUrls: ['./inscriptions-form.component.scss'],
	standalone: true,
	imports: [ReactiveFormsModule, CommonModule]
})
export class InscriptionsFormComponent implements OnInit {
	inscriptionsForm: FormGroup;
	genders: string[] = ["Home", "Dona", "Altres"];
	activities: Activity[] = [];
	referrers: User[] = []
	fee: number = 0;
	numberOfSelectedActivities: number = 0;
	newUser: boolean = true;

	constructor(
		private fb: FormBuilder,
		private usersService: UsersService,
		private activitiesService: ActivitiesService,
		private inscriptionsService: InscriptionsService,
		private dialog: MatDialog,
	) {
		this.inscriptionsForm = this.fb.group({
			user_id: [null, Validators.required],
			user_name: [null, Validators.required],
			last_name: [null, Validators.required],
			gender: [null, Validators.required],
			birthdate: [null, Validators.required],
			birthplace: [null, Validators.required],
			phone: [null, Validators.required],
			email: [null],
			abilities: [null],
			activity1: [null, Validators.required],
			activity2: [null],
			activity3: [null],
			activity4: [null],
			activity5: [null],
			fee: [null],
			referred: [null, Validators.required]
		});
		this.activitiesService.getActivities().subscribe((data: any) => {
			this.activities = data;
			this.activities.sort((a: Activity, b: Activity) => a.activity_name.localeCompare(b.activity_name));
		});
		this.usersService.getUsers().subscribe((data: any) => {
			this.referrers = data.filter((user: User) => user.role === 'Acollida');
		});
	}

	ngOnInit(): void {
		const activity1Changes = this.inscriptionsForm.get('activity1')!.valueChanges;
		const activity2Changes = this.inscriptionsForm.get('activity2')!.valueChanges;
		const activity3Changes = this.inscriptionsForm.get('activity3')!.valueChanges;

		merge(activity1Changes, activity2Changes, activity3Changes)
			.subscribe((value) => {
				if (value === '') {
					this.inscriptionsForm.patchValue({
						activity1: this.inscriptionsForm.get('activity1')!.value === '' ? null : this.inscriptionsForm.get('activity1')!.value,
						activity2: this.inscriptionsForm.get('activity2')!.value === '' ? null : this.inscriptionsForm.get('activity2')!.value,
						activity3: this.inscriptionsForm.get('activity3')!.value === '' ? null : this.inscriptionsForm.get('activity3')!.value,
						activity4: this.inscriptionsForm.get('activity4')!.value === '' ? null : this.inscriptionsForm.get('activity4')!.value,
						activity5: this.inscriptionsForm.get('activity5')!.value === '' ? null : this.inscriptionsForm.get('activity5')!.value
					}, { emitEvent: false });
				}
				this.calculateFee();
			});
	}

	calculateFee(): void {
		this.fee = 0;
		this.numberOfSelectedActivities = 0;

		const selectedActivity1 = this.inscriptionsForm.get('activity1')!.value;
		const selectedActivity2 = this.inscriptionsForm.get('activity2')!.value;
		const selectedActivity3 = this.inscriptionsForm.get('activity3')!.value;

		if (selectedActivity1) this.numberOfSelectedActivities++;
		if (selectedActivity2) this.numberOfSelectedActivities++;
		if (selectedActivity3) this.numberOfSelectedActivities++;

		this.fee = this.numberOfSelectedActivities * 5;
	}

	checkUserId(): void {
		const userId = this.inscriptionsForm.get('user_id')!.value;
		const userIdControl = this.inscriptionsForm.get('user_id');

		if (userId) {
			this.usersService.getUser(userId).pipe(
				catchError((error) => {
					if (error.error.code === "no_user") {
						this.openDialog('Status', 'error', "No s'han trobat dades de " + userId);
						console.error("No user found with ID: ", userId);
					}
					console.error("Error fetching user: ", error);
					return throwError(() => error);
				})
			).subscribe({
				next: (user: any) => {
					if (user !== null) {
						this.inscriptionsForm.patchValue({
							user_name: user.user_name,
							last_name: user.last_name,
							gender: user.gender,
							birthdate: user.birthdate,
							birthplace: user.birthplace,
							phone: user.phone,
							email: user.email,
							abilities: user.abilities
						});

						this.highlightInvalidFields(this.inscriptionsForm);
						this.newUser = false;
						this.openDialog('Status', 'success', 'Usuari trobat: ' + user.user_name + ' ' + user.last_name);
						userIdControl?.setErrors(null);
					}
				},
				error: (error) => {
					console.error("There was an error during the user fetch: ", error);
				}
			});
		} else {
			this.openDialog('Status', 'error', "Introdueixi DNI/NIE de l'usuari");
			console.error("No user ID provided.");
		}
	}

	resetForm(): void {
		this.inscriptionsForm.reset();
		this.highlightInvalidFields(this.inscriptionsForm);
		this.newUser = true;
	}

	openDialog(component: string, status: 'success' | 'error', message: string): void {
		this.dialog.open(DialogComponent, {
			data: { component, status, message }
		});
		this.dialog.afterAllClosed.subscribe(() => {
			window.scrollTo(0, 0);
		});
	}

	createInscription(user: User): void {
		const activity1 = this.activities.find((activity: Activity) => activity.activity_id === this.inscriptionsForm.get('activity1')!.value);
		const activity2 = this.activities.find((activity: Activity) => activity.activity_id === this.inscriptionsForm.get('activity2')?.value);
		const activity3 = this.activities.find((activity: Activity) => activity.activity_id === this.inscriptionsForm.get('activity3')?.value);

		const inscription: Inscription = {
			user_id: user.user_id,
			user_name: user.user_name,
			last_name: user.last_name,
			gender: user.gender,
			birthdate: user.birthdate,
			birthplace: user.birthplace,
			phone: user.phone,
			email: user.email?.length === 0 ? undefined : user.email,
			activity1_name: activity1!.activity_name,
			activity1_instructor: activity1!.instructor,
			activity1_day: activity1!.day,
			activity1_hour: activity1!.hour,
			activity2_name: activity2?.activity_name,
			activity2_instructor: activity2?.instructor,
			activity2_day: activity2?.day,
			activity2_hour: activity2?.hour,
			activity3_name: activity3?.activity_name,
			activity3_instructor: activity3?.instructor,
			activity3_day: activity3?.day,
			activity3_hour: activity3?.hour,
			abilities: user.abilities?.length === 0 ? undefined : user.abilities,
			fee: this.fee,
			activities_selected: this.numberOfSelectedActivities,
			referred: this.inscriptionsForm.get('referred')!.value
		};

		this.inscriptionsService.createInscription(inscription).pipe(
			catchError((error) => {
				console.error("Error creating inscription: ", inscription, 'Error: ', error);
				return throwError(() => error);
			})
		).subscribe({
			next: (data: any) => {
				this.openDialog('Status', 'success', 'Inscripció creada correctament.');
				console.log("Inscription created successfully: " + data);
			},
			error: (error) => {
				console.error("There was an error during the inscription creation: ", error);
			}
		});
		this.resetForm();
	}

	highlightInvalidFields(form: FormGroup) {
		Object.keys(form.controls).forEach((field) => {
			const control = form.get(field);

			const element = document.getElementById(field);
			if (element) {
				if (control?.invalid) {
					if (control.hasError('required')) {
						element.classList.add('error');
						element.classList.remove('success', 'optional');
					}
				} else if (control?.value === null || control?.value === '' || control?.value === undefined) {
					element.classList.add('optional');
					element.classList.remove('success', 'error');
					control?.markAsPristine();
					control?.markAsUntouched();
				} else {
					element.classList.add('success');
					element.classList.remove('error', 'optional');
				}
			}
		});
	}

	onSubmit(): void {
		if (this.inscriptionsForm.invalid) {
			this.highlightInvalidFields(this.inscriptionsForm);
			this.openDialog('Status', 'error', 'Revisa els camps marcats en vermell.');
		} else {
			const user: User = {
				user_id: this.inscriptionsForm.get('user_id')!.value,
				user_name: this.inscriptionsForm.get('user_name')!.value,
				last_name: this.inscriptionsForm.get('last_name')!.value,
				gender: this.inscriptionsForm.get('gender')!.value,
				birthdate: this.inscriptionsForm.get('birthdate')!.value,
				birthplace: this.inscriptionsForm.get('birthplace')!.value,
				phone: this.inscriptionsForm.get('phone')!.value,
				email: this.inscriptionsForm.get('email')?.value,
				abilities: this.inscriptionsForm.get('abilities')?.value
			};

			if (this.newUser) {
				this.usersService.createUser(user).pipe(
					catchError((error) => {
						console.error("Error creating user: ", error);
						return throwError(() => error);
					})
				).subscribe({
					next: (data: any) => {
						console.log("User created successfully: " + data);
						this.createInscription(user);
					},
					error: (error) => {
						console.error("There was an error during the user creation: ", error);
					}
				});
			} else {
				this.usersService.updateUser(user.user_id, user).pipe(
					catchError((error) => {
						console.error("Error updating user: ", error);
						return throwError(() => error);
					})
				).subscribe({
					next: (data: any) => {
						console.log("User updated successfully: " + data);
						this.createInscription(user);
					},
					error: (error) => {
						console.error("There was an error during the user update: ", error);
					}
				});
			}
		}
	}
}
