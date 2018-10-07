import {Component, Injectable, NgModule, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Observable, timer} from 'rxjs';
import {EntityState, EntityStore, PersistNgFormPlugin, QueryEntity, StoreConfig} from "@lx1036/akita";
import {mapTo, tap} from "rxjs/operators";
import {CommonModule} from "@angular/common";
import {RouterModule, Routes} from "@angular/router";

export interface State extends EntityState<Story> {
  loading: boolean;
  someBoolean: boolean;
  skills: string[];
  config: {
    tankOwners: string[];
    time: string;
    isAdmin: boolean;
  };
}

const initialState: State = {
  loading: false,
  someBoolean: true,
  skills: ['JS'],
  config: {
    time: '',
    tankOwners: ['one', 'two '],
    isAdmin: false
  }
};

export type Story = {
  title: string;
  story: string;
  draft: boolean;
  category: string;
};

/**
 * A factory function that creates Stories
 * @param params
 */
export function createStory() {
  return {
    title: '',
    story: '',
    draft: false,
    category: 'js'
  } as Story;
}

@Injectable({
  providedIn: 'root'
})
export class StoriesQuery extends QueryEntity<State, Story> {
  constructor(protected store: StoriesStore) {
    super(store);
  }
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'stories' })
export class StoriesStore extends EntityStore<State, Story> {
  constructor() {
    super(initialState);
  }
}

@Injectable({
  providedIn: 'root'
})
export class StoriesDataService {
  constructor() {}
  
  add(story) {
    return timer(1000).pipe(mapTo(story));
  }
}

@Injectable({
  providedIn: 'root'
})
export class StoriesService {
  constructor(private storiesStore: StoriesStore, private storiesDataService: StoriesDataService) {}
  
  add(story) {
    this.storiesStore.setLoading(true);
    return this.storiesDataService.add(story).pipe(
      tap(entity => {
        this.storiesStore.setLoading(false);
        // this.storiesStore.add(entity);
      })
    );
  }
}

@Component({
  selector: 'app-stories',
  template: `
    <section class="padding">

      <h5>Root Key</h5>
      <form class="col s12" [formGroup]="formRootKey">
        <div class="row">
          <div class="col s12">
            <p>
              <label>
                <input type="checkbox" formControlName="someBoolean"/>
                <span>Is Admin</span>
              </label>
            </p>
          </div>
        </div>
        <button (click)="addSkill()">Add skill</button>
        {{formRootKey.value | json}}
      </form>

      {{formKeyBased.value | json}}
      <h5>Key Based</h5>
      <form class="col s12" [formGroup]="formKeyBased" (ngSubmit)="submit()">
        <div class="row">
          <div class="input-field col s12">
            <input autocomplete="off" formControlName="time" placeholder="Time">
          </div>
        </div>
        <div class="row">
          <div class="col s12">
            <p>
              <label>
                <input type="checkbox" formControlName="isAdmin"/>
                <span>Is Admin</span>
              </label>
            </p>
          </div>
        </div>
      </form>

      <h5>New Story</h5>

      <div class="row">
        <form class="col s12" [formGroup]="form" (ngSubmit)="submit()">


          <div class="row">
            <div class="input-field col s12">
              <input id="title" type="text" autocomplete="off" formControlName="title" placeholder="Title">
            </div>
          </div>

          <div class="row">
            <div class="input-field col s12">
              <textarea id="story" class="materialize-textarea" formControlName="story" placeholder="Story"></textarea>
            </div>
          </div>

          <div class="row">
            <div class="col s12">
              <p>
                <label>
                  <input type="checkbox" formControlName="draft"/>
                  <span>Draft</span>
                </label>
              </p>
            </div>
          </div>


          <div class="row">
            <div class="col s12">
              <label>Category</label>
              <select class="browser-default" formControlName="category">
                <option value="js">JavaScript</option>
                <option value="rxjs">RxJS</option>
                <option value="angular">Angular</option>
              </select>
            </div>
          </div>

          <div class="progress" *ngIf="loading$ | async">
            <div class="indeterminate"></div>
          </div>

          <button class="btn waves-effect waves-light" type="submit" name="action">Submit
            <i class="material-icons right">send</i>
          </button>

        </form>

      </div>

      <div class="row">
        <section style="margin-top: 10px">
          <h6>Form local value:</h6>
          {{form.value | json}}

          <h6>Store value:</h6>
          {{storeValue | async | json}}
        </section>
      </div>

    </section>
  `
})
export class StoriesComponent implements OnInit {
  form: FormGroup;
  formKeyBased: FormGroup;
  formRootKey: FormGroup;
  storeValue;
  persistForm: PersistNgFormPlugin<Story>;
  persistFormKey: PersistNgFormPlugin;
  persistFormRootKey: PersistNgFormPlugin;
  loading$: Observable<boolean>;

  constructor(private storiesQuery: StoriesQuery, private storiesService: StoriesService, private builder: FormBuilder) {}

  ngOnInit() {
    this.loading$ = this.storiesQuery.selectLoading();

    this.form = this.builder.group({
      title: this.builder.control(''),
      story: this.builder.control(''),
      draft: this.builder.control(false),
      category: this.builder.control('js')
    });

    this.formKeyBased = this.builder.group({
      time: this.builder.control(''),
      tankOwners: this.builder.array([]),
      isAdmin: this.builder.control(null)
    });

    this.formRootKey = this.builder.group({
      skills: this.builder.array([]),
      someBoolean: this.builder.control(false)
    });

    this.persistForm = new PersistNgFormPlugin(this.storiesQuery, createStory).setForm(this.form);
    this.persistFormKey = new PersistNgFormPlugin(this.storiesQuery, 'config').setForm(this.formKeyBased, this.builder);
    this.persistFormRootKey = new PersistNgFormPlugin(this.storiesQuery).setForm(this.formRootKey, this.builder);
    this.storeValue = this.storiesQuery.select(state => state.akitaForm);
  }

  submit() {
    this.storiesService.add(this.form.value).subscribe(() => this.persistForm.reset());
    this.persistFormKey.reset();
    this.persistFormRootKey.reset();
  }

  ngOnDestroy() {
    this.persistForm && this.persistForm.destroy();
  }

  addSkill() {
    (this.formRootKey.get('skills') as FormArray).push(this.builder.control('Akita'));
  }
}

const routes: Routes = [
  {
    path: 'stories',
    component: StoriesComponent,
  },
];

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)],
  exports: [],
  declarations: [StoriesComponent]
})
export class StoriesModule {}