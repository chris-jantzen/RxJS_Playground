import axios, { AxiosResponse } from 'axios';
import {
  Observable,
  of,
  from,
  shareReplay,
  Subject,
  BehaviorSubject,
  combineLatest,
  merge,
  interval,
  timer,
} from 'rxjs';
import {
  map,
  concatAll,
  delay,
  scan,
  tap,
  reduce,
  switchMap,
  catchError,
  retry,
  takeWhile,
  takeUntil,
} from 'rxjs/operators';

const testingMapsAndPipes = () => {
  of(1, 2, 3)
    .pipe(map((x: number) => x ** 2))
    .subscribe(console.log);

  // Alternative to using .pipe
  map((x: number) => x ** 2)(of(1, 2, 3)).subscribe(console.log);
};

const apiPlayground = () => {
  const serverTest = async () => {
    const url: string = 'http://localhost:5000/';
    const urlObservable = new Observable<string>((observer) => {
      observer.next(url);
      observer.next(url);
      observer.next(url);
      observer.complete();
    });

    const fileObservable = urlObservable.pipe(
      map((urlStr: string) => from(axios.get(urlStr))),
      concatAll()
    );
    fileObservable.subscribe(({ data: res }) => console.log(res));
  };

  // This is probably pretty dumb, but it works.
  const altServerTest = () => {
    const urlObservable = new Observable<AxiosResponse>((observer) => {
      axios
        .get('http://localhost:5000')
        .then(({ data: res }) => {
          observer.next(res);
          observer.complete();
        })
        .catch((err) => {
          observer.error(err);
        });
    });

    urlObservable.subscribe({
      next: (data) => console.log(data),
      complete: () => console.log('[complete]'),
      error: (err) => console.error(err),
    });
  };
};

const subjectsPlayground = () => {
  // Cold Vs. Hot Observables and Subjects/Behavior Subjects
  const coldObservable = () => {
    const cold = new Observable((observer) => {
      observer.next(~~(Math.random() * 99 + 1));
    });
    cold.subscribe(console.log);
    cold.subscribe(console.log);
  };

  const hotObservable = () => {
    const cold = new Observable((observer) => {
      observer.next(~~(Math.random() * 99 + 1));
    });
    const hot = cold.pipe(shareReplay(1));
    hot.subscribe(console.log);
    hot.subscribe(console.log);
  };

  const subjects = () => {
    const subject = new Subject();
    subject.subscribe(console.log);

    subject.next('Hello');
    subject.next('World');

    // Gotcha with 'Subject': Subscribed too late after the values were added
    // Hence 'BehaviorSubject'
    subject.subscribe(console.log);
  };

  const behaviorSubjects = () => {
    const bs = new BehaviorSubject('Hola');

    bs.subscribe(console.log);

    bs.next('Mundo');

    bs.subscribe(console.log);
  };
};

const pipesPlayground = () => {
  const fromPipe = () => {
    const source = from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const modified = source.pipe(map((x) => x ** 2));
    const sum = source.pipe(
      scan((acc: number, curr: number) => acc + curr, 0) // returns all intermediate values
      // reduce((acc: number, curr: number) => acc + curr, 0) // returns only the final value
    );
    // source.subscribe(console.log); // 1...10
    // modified.subscribe(console.log); // 1...100
    sum.subscribe(console.log); // 1 + ... + 10
  };
  fromPipe();
};
// pipesPlayground();

/**
 * Backpressure Notes
 * Debounce: Only emit after some limit has been met.
 *  e.g. if a full second has passed since a mouse event has stopped, then allow the subscription to go
 *
 * Throttle: Allow the first value to occur but then make sure no additional values can occur
 *  until after some condition.
 *  e.g. Only allow up to 1 mouse movement event per second.
 *
 * Buffer: Keep all data but not listen to it all at once. Collects all of the events into an array but only emits them
 *  when they reach a specified length, etc.
 */

const switchMapPlayground = () => {
  const user$ = of({ uid: Math.random() });
  const fetchOrders = (userId) => {
    return of(`${userId}'s order data`);
  };
  // Naive way
  // let orders;
  // user$.subscribe(user => {
  //   fetchOrders(user.uid).subscribe(data => {
  //     orders = data;
  //   });
  // });
  const orders$ = user$.pipe(
    switchMap((user) => {
      return fetchOrders(user.uid); // Return an observable, but can return a promise/array
    })
  );
};

const combineObservables = () => {
  const randoAsync = new Observable((observer) => {
    observer.next(Math.random());
  });
  const delayed = randoAsync.pipe(delay(1000));

  const combo = combineLatest([delayed, randoAsync, randoAsync, randoAsync]);
  // combo.subscribe(console.log);

  const merged = merge(delayed, randoAsync, randoAsync, randoAsync);
  merged.subscribe((val) => {
    console.log(val);
  });
  console.log('first three^');
  setTimeout(() => {
    console.log('delayed value ^');
  }, 1001);
};

// combineObservables();

const errors = () => {
  const sub = new Subject();

  sub
    .pipe(
      catchError((err) => of('something broke')),
      retry(2)
    )
    .subscribe(console.log);

  sub.next('good');
  sub.error('broken!');
};

// errors();

const memoryLeaks = () => {
  const source = interval(100);

  // Does Work
  // const subscription = source.subscribe((v) => {
  //   console.log(v);
  //   if (v < 10) {
  //    subscription.unsubscribe();
  //   }
  // });

  const example = source.pipe(takeWhile((v) => v <= 10));
  example.subscribe(console.log);

  const example2 = source.pipe(takeUntil(timer(2000)));
  example2.subscribe(console.log);
};
