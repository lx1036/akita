import {Observable, Subject} from "rxjs";
import {isFunction} from "@lx1036/akita";
import {takeUntil} from "rxjs/operators";


export const untilDestroyed = (
  componentInstance,
  destroyMethodName = 'ngOnDestroy',
) => <T>( source: Observable<T> ) => {
  const originalDestroy = componentInstance[ destroyMethodName ];
  if (isFunction(originalDestroy) === false) {
    throw new Error(
      `${
        componentInstance.constructor.name
        } is using untilDestroyed but doesn't implement ${destroyMethodName}`,
    );
  }
  
  if (!componentInstance[ '__takeUntilDestroy' ]) {
    componentInstance[ '__takeUntilDestroy' ] =
      componentInstance[ '__takeUntilDestroy' ] || new Subject();
    
    componentInstance[ destroyMethodName ] = function () {
      isFunction(originalDestroy) && originalDestroy.apply(this, arguments);
      componentInstance[ '__takeUntilDestroy' ].next(true);
      componentInstance[ '__takeUntilDestroy' ].complete();
    };
  }
  
  return source.pipe(takeUntil<T>(componentInstance[ '__takeUntilDestroy' ]));
};