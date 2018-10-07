import {Component, Injectable, NgModule, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Router, RouterModule, Routes} from '@angular/router';
import {CommonModule} from "@angular/common";
import {mapTo, tap} from "rxjs/operators";
import {timer} from "rxjs";
import {ID, Query, Store, StoreConfig} from "@lx1036/akita";

export type Creds = {
  email: string;
  password: string;
};

export type User = {
  id: ID;
  firstName: string;
  lastName: string;
  token: string;
};

export function createEmptyUser() {
  return {
    id: null,
    firstName: '',
    lastName: '',
    token: ''
  } as User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthQuery extends Query<User> {
  isLoggedIn$ = this.select(user => !!user.token || inStorage());
  
  constructor(protected store: AuthStore) {
    super(store);
  }
}

export function inStorage() {
  const storage = JSON.parse(localStorage.getItem('AkitaStores'));
  return storage && storage.auth;
}

export const initialState: User = createEmptyUser();

@Injectable({
  providedIn: 'root'
})
@StoreConfig({
  name: 'auth'
})
export class AuthStore extends Store<User> {
  constructor() {
    super(initialState);
  }
}

const user: User = {
  id: 1,
  firstName: 'Netanel',
  lastName: 'Basal',
  token: 'token'
};

@Injectable({
  providedIn: 'root'
})
export class AuthDataService {
  /**
   *
   * @param {string} email
   * @param {string} password
   * @returns {Observable<{}>}
   */
  login(creds: Creds) {
    return timer(400).pipe(mapTo(user));
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private authStore: AuthStore, private authDataService: AuthDataService) {}
  
  login(creds: Creds) {
    return this.authDataService.login(creds).pipe(
      tap(user => {
        this.authStore.update(user);
      })
    );
  }
  
  logout() {
    this.authStore.update(createEmptyUser());
  }
}

@Component({
  template: `
    <div class="row padding" style="width: 50%; margin: auto;">
      <form class="col s12" [formGroup]="login" (submit)="submit()">
        <div class="row">
          <div class="input-field">
            <i class="material-icons prefix">email</i>
            <input id="icon_prefix" type="text" class="validate" formControlName="email">
            <label for="icon_prefix">Email</label>
          </div>
          <div class="input-field">
            <i class="material-icons prefix">lock_open</i>
            <input id="icon_telephone" type="tel" class="validate" formControlName="password">
            <label for="icon_telephone">Password</label>
          </div>
        </div>

        <button class="btn waves-effect waves-light flex" style="margin-left: auto;" type="submit">Submit
          <i class="material-icons right">send</i>
        </button>

      </form>
    </div>
  `
})
export class LoginComponent implements OnInit {
  login: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.login = this.fb.group({
      email: this.fb.control(''),
      password: this.fb.control('')
    });
  }

  submit() {
    this.authService.login(this.login.value as Creds).subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private router: Router) {}
  
  canActivate(): boolean {
    if (inStorage()) {
      return true;
    }
    
    this.router.navigateByUrl('login');
    return false;
  }
}

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    LoginComponent
  ]
})
export class LoginModule {}