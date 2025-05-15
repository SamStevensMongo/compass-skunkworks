import type { Reducer, AnyAction, Action } from 'redux';
import type { CollectionMetadata } from 'mongodb-collection-model';
import type { ThunkAction } from 'redux-thunk';
import type AppRegistry from 'hadron-app-registry';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { CollectionSubtab } from '@mongodb-js/compass-workspaces';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import { SampledDocuments } from '../constants';

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

type CollectionThunkAction<R, A extends AnyAction = AnyAction> = ThunkAction<
  R,
  CollectionState,
  {
    localAppRegistry: AppRegistry;
    dataService: DataService;
    workspaces: ReturnType<typeof workspacesServiceLocator>;
  },
  A
>;

export type CollectionState = {
  workspaceTabId: string;
  namespace: string;
  metadata: CollectionMetadata | null;
  editViewName?: string;
  collections: Array<string>;
  sampledDocuments: Array<SampledDocuments> | null;
};

enum CollectionActions {
  CollectionMetadataFetched = 'compass-collection/CollectionMetadataFetched',
  CollectionsFetched = 'compass-collection/CollectionsFetched',
  SampleDocumentsFetched = 'compass-collection/SampleDocumentsFetched',
  SampleDocumentsFetchError = 'compass-collection/SampleDocumentsFetchError',
}

interface CollectionMetadataFetchedAction {
  type: CollectionActions.CollectionMetadataFetched;
  metadata: CollectionMetadata;
}
interface CollectionsFetchedAction {
  type: CollectionActions.CollectionsFetched;
  collections: Array<string>;
}

interface SampleDocumentsFetchedAction {
  type: CollectionActions.SampleDocumentsFetched;
  sampledDocuments: Array<SampledDocuments> | null;
}

interface SampleDocumentsFetchErrorAction {
  type: CollectionActions.SampleDocumentsFetchError;
  error: string;
}

const reducer: Reducer<CollectionState, Action> = (
  state = {
    // TODO(COMPASS-7782): use hook to get the workspace tab id instead
    workspaceTabId: '',
    namespace: '',
    metadata: null,
    collections: [],
    sampledDocuments: null,
  },
  action
) => {
  if (
    isAction<CollectionMetadataFetchedAction>(
      action,
      CollectionActions.CollectionMetadataFetched
    )
  ) {
    return {
      ...state,
      metadata: action.metadata,
    };
  }

  if (
    isAction<CollectionsFetchedAction>(
      action,
      CollectionActions.CollectionsFetched
    )
  ) {
    return {
      ...state,
      collections: action.collections,
    };
  }

  if (
    isAction<SampleDocumentsFetchedAction>(
      action,
      CollectionActions.SampleDocumentsFetched
    )
  ) {
    return {
      ...state,
      sampledDocuments: action.sampledDocuments,
    };
  }

  if (
    isAction<SampleDocumentsFetchErrorAction>(
      action,
      CollectionActions.SampleDocumentsFetchError
    )
  ) {
    return {
      ...state,
      error: action.error,
      sampledDocuments: [],
    };
  }
  return state;
};

export const collectionMetadataFetched = (
  metadata: CollectionMetadata
): CollectionMetadataFetchedAction => {
  return { type: CollectionActions.CollectionMetadataFetched, metadata };
};

export const collectionsFetched = (
  collections: Array<string>
): CollectionsFetchedAction => {
  return { type: CollectionActions.CollectionsFetched, collections };
};

export const sampledDocumentsFetched = (
  sampledDocuments: Array<SampledDocuments>
): SampleDocumentsFetchedAction => {
  return { type: CollectionActions.SampleDocumentsFetched, sampledDocuments };
};

const sampledDocumentsFetchError = (
  error: string
): SampleDocumentsFetchErrorAction => {
  return { type: CollectionActions.SampleDocumentsFetchError, error };
};

export const selectTab = (
  tabName: CollectionSubtab
): CollectionThunkAction<void> => {
  return (_dispatch, getState, { workspaces }) => {
    workspaces.openCollectionWorkspaceSubtab(
      getState().workspaceTabId,
      tabName
    );
  };
};

export const sampleDocumentsFetched = (
  sampledDocuments: Array<SampledDocuments>
): SampleDocumentsFetchedAction => {
  return { type: CollectionActions.SampleDocumentsFetched, sampledDocuments };
};

const sampleDocumentsFetchError = (
  error: string
): SampleDocumentsFetchErrorAction => {
  return { type: CollectionActions.SampleDocumentsFetchError, error };
};

export const fetchSampleDocuments = (
  namespaces: Array<string>
): CollectionThunkAction<void> => {
  return async (dispatch, _getState, { dataService }) => {
    try {
      const sampledDocumentsResponse = await Promise.all(
        namespaces.map(async (namespace) => {
          return await dataService.sample(namespace, { size: 5 });
        })
      );
      const sampledDocuments: Array<SampledDocuments> =
        sampledDocumentsResponse.map((documents, index) => {
          return {
            collectionName: namespaces[index],
            documents,
          };
        });
      dispatch(sampleDocumentsFetched(sampledDocuments));
    } catch (err) {
      dispatch(sampleDocumentsFetchError((err as Error).message));
    }
  };
};
export type CollectionTabPluginMetadata = CollectionMetadata & {
  /**
   * Initial query for the query bar
   */
  query?: unknown;
  /**
   * Stored pipeline metadata. Can be provided to preload stored pipeline
   * right when the plugin is initialized
   */
  aggregation?: unknown;
  /**
   * Initial pipeline that will be converted to a string to be used by the
   * aggregation builder. Takes precedence over `pipelineText` option
   */
  pipeline?: unknown[];
  /**
   * Initial pipeline text to be used by the aggregation builder
   */
  pipelineText?: string;
  /**
   * Namespace for the view that is being edited. Needs to be provided with the
   * `pipeline` options
   */
  editViewName?: string;
};

export default reducer;
