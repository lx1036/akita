import {Component, ElementRef, Injectable, NgModule, OnDestroy, OnInit} from '@angular/core';
import { Observable } from 'rxjs';
import {
  DirtyCheckPlugin,
  EntityDirtyCheckPlugin,
  EntityState,
  EntityStore,
  ID,
  QueryEntity,
  StoreConfig
} from "@lx1036/akita";
import {HttpClient, HttpClientModule} from "@angular/common/http";
import {RouterModule, Routes} from "@angular/router";
import {CommonModule} from "@angular/common";

export type Widget = {
  id: ID;
  name: string;
};

let _id = 0;

/**
 * A factory function that creates Widgets
 * @param params
 */
export function createWidget(params?: Partial<Widget>) {
  return {
    id: ++_id,
    name: `Widget ${_id}`
  } as Widget;
}

export function resetId(count?: number) {
  _id = count || 0;
}

export interface State extends EntityState<Widget> {
  name: string;
}

const initState = {
  name: 'Akita widgets'
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'widgets' })
export class WidgetsStore extends EntityStore<State, Widget> {
  constructor() {
    super(initState);
  }
}

@Injectable({
  providedIn: 'root'
})
export class WidgetsQuery extends QueryEntity<State, Widget> {
  constructor(protected store: WidgetsStore) {
    super(store);
  }
}

@Injectable({
  providedIn: 'root'
})
export class WidgetsDataService {
  constructor(private http: HttpClient) {}
}

@Injectable({
  providedIn: 'root'
})
export class WidgetsService {
  constructor(private widgetsStore: WidgetsStore, private widgetsDataService: WidgetsDataService) {}
  
  initWidgets() {
    const widgets = [createWidget(), createWidget(), createWidget(), createWidget(), createWidget()];
    this.widgetsStore.set(widgets);
  }
  
  updateWidget(id: ID, name: string) {
    this.widgetsStore.update(id, { name });
  }
  
  add() {
    this.widgetsStore.add(createWidget());
  }
  
  remove(id?: ID) {
    this.widgetsStore.remove(id);
    this.widgetsStore.setDirty();
  }
  
  updateName(name: string) {
    this.widgetsStore.updateRoot({name});
  }
}

@Component({
  selector: 'app-widgets',
  template: `
    <div class="padding flex flex-column">
      <div class="flex align-center">
        <h4 style="margin-right: 20px;">Page name: {{ dashoboardName$ | async }}</h4>
        <input (keydown.enter)="updateName(pageName)" [value]="dashoboardName$ | async" #pageName style="width: 250px;margin-right: 20px;">
        <button class="btn waves-effect waves-light" style="margin: 20px 10px 0 0;" (click)="updateName(pageName)">Update Name
          <i class="material-icons right">save</i>
        </button>
      </div>
      <div>
        <h6>The dirty check plugin is only listening to widgets changes and therefore isn't effecting the page name</h6>
      </div>
      <div class="all-widgets-dirty-check flex flex-column flex-1 align-center">
        <table class="striped centered padding">
          <thead>
            <tr>
              <th>Id</th>
              <th>Name</th>
              <th>Update</th>
              <th>Revert</th>
              <th>Delete</th>
            </tr>
          </thead>

          <tbody>
            <tr *ngFor="let widget of widgets$ | async">
              <td>{{widget.id}}</td>
              <td style="width: 200px;">
                <input (keydown.enter)="updateWidget(widget.id, name.value)" [value]="widget.name" #name style="margin-right: 20px;">
              </td>
              <td>
                <a class="btn-floating">
                  <i class="material-icons" (click)="updateWidget(widget.id, name.value)">save</i>
                </a>
              </td>
              <td>
                <a class="btn-floating"
                   [class.disabled]="!(widgetsSpecific.isDirty(widget.id) | async)">
                  <i class="material-icons" (click)="revert(widget.id)">undo</i>
                </a>
              </td>
              <td>
                <a class="btn-floating"><i class="material-icons" (click)="remove(widget.id)">delete</i></a>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="flex sb">
          <button class="btn waves-effect waves-light" style="margin: 20px 10px 0 0;" (click)="remove()">Clear list
            <i class="material-icons right">clear</i>
          </button>
          <button class="btn waves-effect waves-light" style="margin: 20px 10px 0 0;" (click)="add()">Add widget
            <i class="material-icons right">add_circle</i>
          </button>
          <button class="btn waves-effect waves-light tooltipped"
                  style="margin: 20px 10px 0 0;"
                  [class.disabled]="!(collection.isDirty$ | async)"
                  (click)="revertStore()">Reset Store Entities
            <i class="material-icons right">undo</i>
          </button>
        </div>
      </div>
    </div>
  `
})
export class WidgetsComponent implements OnInit, OnDestroy {
  collection: DirtyCheckPlugin<Widget>;
  widgetsSpecific: EntityDirtyCheckPlugin<Widget>;
  widgets$: Observable<Widget[]>;
  dashoboardName$: Observable<string>;

  constructor(private widgetsQuery: WidgetsQuery, private widgetService: WidgetsService, private element: ElementRef) {}

  ngOnInit() {
    /** check isPristine */
    if (this.widgetsQuery.isEmpty() && this.widgetsQuery.isPristine) {
      this.widgetService.initWidgets();
    }
    this.dashoboardName$ = this.widgetsQuery.select(state => state.name);
    this.widgets$ = this.widgetsQuery.selectAll();
    this.collection = new DirtyCheckPlugin(this.widgetsQuery, { watchProperty: 'entities' }).setHead();
    this.widgetsSpecific = new EntityDirtyCheckPlugin(this.widgetsQuery).setHead();
  }

  updateName(nameInput) {
    this.widgetService.updateName(nameInput.value);
  }

  updateWidget(id: ID, name: string) {
    this.widgetService.updateWidget(id, name);
  }

  add() {
    this.widgetService.add();
  }

  remove(id?: ID) {
    this.widgetService.remove(id);
  }

  revert(id) {
    this.widgetsSpecific.reset(id);
  }

  revertStore() {
    resetId(5);
    this.collection.reset();
  }

  ngOnDestroy() {
    resetId();
    this.collection.destroy();
    this.widgetsSpecific.destroy();
  }
}

const routes: Routes = [
  {
    path: 'widgets',
    component: WidgetsComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule.forChild(routes),
  ],
  declarations: [WidgetsComponent]
})
export class WidgetsModule {}