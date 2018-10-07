import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { TodosPageComponent, TodosFiltersComponent, TodoComponent, TodosComponent } from './todos-page.component';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule],
  exports: [],
  declarations: [TodoComponent, TodosComponent, TodosFiltersComponent, TodosPageComponent]
})
export class TodosModule {}
