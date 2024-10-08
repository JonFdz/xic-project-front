import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '@models/user.model';
import { environment } from 'environments/environment';

@Injectable({
	providedIn: 'root'
})
export class UsersService {
	private apiUrl = 'https://xicnoubarris.org/wp-json/xicapi/v2/users';

	constructor(private http: HttpClient) { }

	getUsers(): Observable<User[]> {
		return this.http.get<User[]>(this.apiUrl);
	}

	getUser(id: string): Observable<User> {
		return this.http.get<User>(`${this.apiUrl}/${id}`);
	}

	createUser(user: User): Observable<User> {
		return this.http.post<User>(this.apiUrl, user);
	}

	updateUser(id: string, user: User): Observable<User> {
		return this.http.put<User>(`${this.apiUrl}/${id}`, user);
	}

	deleteUser(id: string): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/${id}`);
	}
}
