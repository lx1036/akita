import {
  APP_INITIALIZER,
  Inject,
  InjectionToken,
  ModuleWithProviders,
  NgModule,
  NgZone,
  Optional
} from '@angular/core';
import { BrowserModule,  } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TodosModule } from './todos/todos-page.component';
import { AppComponent } from './app.component';
import {APP_BASE_HREF} from "@angular/common";
import {akitaDevtools, DevtoolsOptions} from "@lx1036/akita";
import {StoriesModule} from "./stories/stories.component";
import {WidgetsModule} from "./wigets/widgets.component";


export const DEVTOOLS_OPTIONS = new InjectionToken('DevtoolsOptions');

export class AkitaDevtools {
  constructor(public ngZone: NgZone, @Inject(DEVTOOLS_OPTIONS) @Optional() public options) {
    akitaDevtools(this.ngZone, this.options);
  }
}

@NgModule()
export class AkitaNgDevTools {
  static forRoot(options?: Partial<DevtoolsOptions>): ModuleWithProviders {
    return {
      ngModule: AkitaNgDevTools,
      providers: [
        AkitaDevtools,
        {
          provide: DEVTOOLS_OPTIONS,
          useValue: options,
        },
        {
          provide: APP_INITIALIZER,
          useFactory: (devtools: AkitaDevtools) => () => AkitaDevtools,
          deps: [AkitaDevtools],
          multi: true,
        }
      ]
    }
  }
}


const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'todos'
  },
];

@NgModule({
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes),
    AkitaNgDevTools.forRoot(),
  
    TodosModule,
    StoriesModule,
    WidgetsModule,
  ],
  declarations: [AppComponent],
  providers: [
    {provide: APP_BASE_HREF, useValue: '/'}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
