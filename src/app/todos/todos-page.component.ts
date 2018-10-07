import { Component, OnInit, Injectable, 
ChangeDetectionStrategy, OnDestroy, Input,Output, EventEmitter } from '@angular/core';
import {FormControl} from '@angular/forms';
import {combineLatest, Observable } from 'rxjs';
import {ID, guid, QueryEntity, StoreConfig, EntityStore, EntityState } from '@lx1036/akita';
import { map } from 'rxjs/operators';
import {untilDestroyed} from "../utils/rxjs_pipes";


export type Todo = {
  id: ID;
  title: string;
  completed: boolean;
};

export enum VISIBILITY_FILTER {
  SHOW_COMPLETED = 'SHOW_COMPLETED',
  SHOW_ACTIVE = 'SHOW_ACTIVE',
  SHOW_ALL = 'SHOW_ALL'
}

export type TodoFilter = {
  label: string;
  value: VISIBILITY_FILTER;
};

export const initialFilters: TodoFilter[] = [
  { label: 'All', value: VISIBILITY_FILTER.SHOW_ALL },
  { label: 'Completed', value: VISIBILITY_FILTER.SHOW_COMPLETED },
  { label: 'Active', value: VISIBILITY_FILTER.SHOW_ACTIVE }
];


export interface TodoState extends EntityState<Todo> {
  ui: {
    filter: VISIBILITY_FILTER
  };
}

const initialState = {
  ui: { filter: VISIBILITY_FILTER.SHOW_ALL }
};

@Injectable({
  providedIn: 'root'
})
@StoreConfig({ name: 'todos' })
export class TodosStore extends EntityStore<TodoState, Todo> {
  constructor() {
    super(initialState);
  }
}

@Injectable({
  providedIn: 'root'
})
export class TodosQuery extends QueryEntity<TodoState, Todo> {
  selectVisibilityFilter$ = this.select(state => state.ui.filter);

  selectVisibleTodos$ = combineLatest(
    this.selectVisibilityFilter$,
    this.selectAll(),
    this.getVisibleTodos
  );

  selectAllDone$ = this.selectCount(todo => todo.completed).pipe(
    map(count => {
      return this.getCount() > 0 && count === this.getCount();
    })
  );

  constructor(protected store: TodosStore) {
    super(store);
  }

  private getVisibleTodos(filter, todos): Todo[] {
    switch (filter) {
      case VISIBILITY_FILTER.SHOW_COMPLETED:
        return todos.filter(t => t.completed);
      case VISIBILITY_FILTER.SHOW_ACTIVE:
        return todos.filter(t => !t.completed);
      default:
        return todos;
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class TodosService {
  constructor(private todosStore: TodosStore) { }

  updateFilter(filter: VISIBILITY_FILTER) {
    this.todosStore.updateRoot({
      ui: {
        filter
      }
    });
  }
  
  complete({ id, completed }: Todo) {
    this.todosStore.update(id, {completed});
  }

  add(title: string) {
    const todo = {
      id: guid(),
      title,
      completed: false
    };
    
    this.todosStore.add(todo);
  }

  delete(id: ID) {
    this.todosStore.remove(id);
  }
}

@Component({
  selector: 'app-todos-filters',
  template: `
    <div class="input-field col s12">
      <select [formControl]="control" class="browser-default">
        <option *ngFor="let filter of filters;" [ngValue]="filter.value">{{filter.label}}
        </option>
      </select>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodosFiltersComponent implements OnInit, OnDestroy {
  @Input() active: VISIBILITY_FILTER;
  @Input() filters: TodoFilter[];
  @Output() update = new EventEmitter<VISIBILITY_FILTER>();

  control: FormControl;

  ngOnInit() {
    this.control = new FormControl(this.active);

    this.control.valueChanges.pipe(untilDestroyed(this)).subscribe(c => {
      this.update.emit(c);
    });
  }

  ngOnDestroy(): void {}
}


@Component({
  selector: 'app-todo',
  template: `
    <div class="flex align-center sb">
     <div class="flex">
      <label>
        <input type="checkbox" [formControl]="control"/>
        <span></span>
      </label>
      {{todo.title}}
    </div>
    <a class="btn waves-effect waves-light red btn-small btn-floating">
      <i class="material-icons" (click)="delete.emit(todo.id)">delete_forever</i>
    </a>
   </div>
  `, 
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoComponent implements OnInit, OnDestroy {
  @Input() todo: Todo;
  @Output() complete = new EventEmitter<Todo>();
  @Output() delete = new EventEmitter<ID>();

  control: FormControl;

  ngOnInit() {
    this.control = new FormControl(this.todo.completed);

    this.control.valueChanges.pipe(untilDestroyed(this)).subscribe((completed: boolean) => {
      this.complete.emit({ ...this.todo, completed });
    });
  }

  ngOnDestroy(): void { }
}

@Component({
  selector: 'app-todos',
  template: `
    <div class="collection with-header">
      <h4 class="collection-header">Todos:</h4>
      <app-todo *ngFor="let todo of todos;"
                class="collection-item"
                (delete)="delete.emit($event)"
                (complete)="complete.emit($event)"
                [todo]="todo"></app-todo>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodosComponent {
  @Input() todos: Todo[];
  @Output() complete = new EventEmitter<Todo>();
  @Output() delete = new EventEmitter<ID>();
}

@Component({
  selector: 'app-todos-page',
  template: `
    <div class="input-field">
      <i class="material-icons prefix">add_alarm</i>
      <input type="text" class="form-control" placeholder="Add Todo..." #input (keydown.enter)="add(input)">
    </div>

    <app-todos-filters (update)="changeFilter($event)" [filters]="filters" [active]="activeFilter$ | async"></app-todos-filters>

    <app-todos [todos]="todos$ | async" (delete)="deleteTodo($event)" (complete)="complete($event)"></app-todos>

    <div *ngIf="selectAllDone$ | async">All done!!!!</div>
  `
})
export class TodosPageComponent implements OnInit {
  todos$: Observable<Todo[]>;
  activeFilter$: Observable<VISIBILITY_FILTER>;
  selectAllDone$: Observable<boolean>;
  filters = initialFilters;

  constructor(private todosQuery: TodosQuery, private todosService: TodosService) {}

  ngOnInit() {
    this.todos$ = this.todosQuery.selectVisibleTodos$;
    this.activeFilter$ = this.todosQuery.selectVisibilityFilter$;
    this.selectAllDone$ = this.todosQuery.selectAllDone$;
  }

  add(input: HTMLInputElement) {
    this.todosService.add(input.value);
    input.value = '';
  }

  complete(todo: Todo) {
    this.todosService.complete(todo);
  }
  
  deleteTodo(id: ID) {
    this.todosService.delete(id);
  }

  changeFilter(filter: VISIBILITY_FILTER) {
    this.todosService.updateFilter(filter);
  }
}