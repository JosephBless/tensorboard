/* Copyright 2020 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
import {Injectable} from '@angular/core';
import {fromEvent, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {createURLSearchParamsFromSerializableQueryParams} from './internal_utils';
import {
  Navigation,
  NavigationFromHistory,
  Route,
  SerializableQueryParams,
} from './types';

export interface LocationInterface {
  getHref(): string;

  getSearch(): SerializableQueryParams;

  getHash(): string;

  getPath(): string;

  replaceState(data: any, url: string | null): void;

  pushState(url: string): void;

  onPopState(): Observable<NavigationFromHistory>;

  getResolvedPath(relativePath: string): string;

  getFullPathFromRouteOrNav(routeLike: Route | Navigation): string;
}

const utils = {
  getHref() {
    return window.location.href;
  },
};

function isNavigation(
  navOrRoute: Navigation | Route
): navOrRoute is Navigation {
  return (
    navOrRoute.hasOwnProperty('pathname') &&
    !navOrRoute.hasOwnProperty('queryParams')
  );
}

@Injectable()
export class Location implements LocationInterface {
  getHref(): string {
    return utils.getHref();
  }

  getSearch(): SerializableQueryParams {
    const searchParams = new URLSearchParams(window.location.search);
    const serializableSearchParams: SerializableQueryParams = [];

    // URLSearchParams is a Iterable but TypeScript does not know about that.
    searchParams.forEach((value: string, key: string) => {
      serializableSearchParams.push({key, value});
    });

    return serializableSearchParams;
  }

  getHash(): string {
    return window.location.hash;
  }

  getPath(): string {
    return window.location.pathname;
  }

  getHistoryState() {
    return window.history.state;
  }

  replaceState(data: any, url: string | null): void {
    window.history.replaceState(data, '', url);
  }

  pushState(url: string): void {
    window.history.pushState(null, '', url);
  }

  onPopState(): Observable<NavigationFromHistory> {
    return fromEvent<PopStateEvent>(window, 'popstate').pipe(
      map((e) => {
        return {
          pathname: this.getPath(),
          state: e.state,
        };
      })
    );
  }

  getResolvedPath(relativePath: string): string {
    const url = new URL(relativePath, utils.getHref());
    return url.pathname;
  }

  getFullPathFromRouteOrNav(
    routeLike: Route | Navigation,
    shouldPreserveHash?: boolean
  ): string {
    // TODO(stephanwlee): support hashes in the routeLike.
    const pathname = this.getResolvedPath(routeLike.pathname);
    let search = '';
    if (!isNavigation(routeLike) && routeLike.queryParams.length) {
      search =
        '?' +
        createURLSearchParamsFromSerializableQueryParams(
          routeLike.queryParams
        ).toString();
    }
    const hash = shouldPreserveHash ? this.getHash() : '';
    return `${pathname}${search}${hash}`;
  }
}

export const TEST_ONLY = {
  utils,
};
