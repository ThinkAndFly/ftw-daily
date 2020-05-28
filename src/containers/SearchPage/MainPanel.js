import React, { Component } from 'react';
import { array, bool, func, number, object, shape, string } from 'prop-types';
import classNames from 'classnames';
import omit from 'lodash/omit';
import config from '../../config';
import routeConfiguration from '../../routeConfiguration';
import { FormattedMessage } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import { findActiveFilter } from '../../util/search';
import { propTypes } from '../../util/types';
import {
  SearchResultsPanel,
  SearchFilters,
  SearchFiltersMobile,
  SearchFiltersPanel,
  SortBy,
} from '../../components';

import FilterComponent from './FilterComponent';
import { validFilterParams } from './SearchPage.helpers';

import css from './SearchPage.css';

const FILTER_DROPDOWN_OFFSET = -14;

/**
 * MainPanel contains search results and filters.
 * There are 3 presentational container-components that show filters:
 * Searchfilters, SearchfiltersMobile, and SearchFiltersPanel.
 */
class MainPanel extends Component {
  constructor(props) {
    super(props);
    this.state = { isSearchFiltersPanelOpen: false, currentQueryParams: props.urlQueryParams };

    this.applyFilters = this.applyFilters.bind(this);
    this.cancelFilters = this.cancelFilters.bind(this);
    this.resetAll = this.resetAll.bind(this);

    this.initialValue = this.initialValue.bind(this);
    this.handleChangedValue = this.handleChangedValue.bind(this);

    // SortBy
    this.handleSortBy = this.handleSortBy.bind(this);
  }

  // Apply the filters by redirecting to SearchPage with new filters.
  applyFilters() {
    const { history, urlQueryParams } = this.props;

    history.push(
      createResourceLocatorString(
        'SearchPage',
        routeConfiguration(),
        {},
        { ...urlQueryParams, ...this.state.currentQueryParams }
      )
    );
  }

  // Close the filters by clicking cancel, revert to the initial params
  cancelFilters() {
    this.setState({ currentQueryParams: {} });
  }

  // Reset all filter query parameters
  resetAll(e) {
    const { urlQueryParams, history, filterConfig } = this.props;
    const filterQueryParamNames = filterConfig.map(f => f.queryParamName);

    // Reset state
    this.setState({ currentQueryParams: {} });

    // Reset routing params
    const queryParams = omit(urlQueryParams, filterQueryParamNames);
    history.push(createResourceLocatorString('SearchPage', routeConfiguration(), {}, queryParams));
  }

  initialValue(queryParamName, parse) {
    const currentQueryParams = this.state.currentQueryParams;
    const urlQueryParams = this.props.urlQueryParams;

    // initialValue for a filter should come
    // either from state.currentQueryParam or fallback to urlQueryParam
    const currentQueryParam = currentQueryParams[queryParamName];
    const hasQueryParamInState = typeof currentQueryParam !== 'undefined';

    const initialValue = hasQueryParamInState ? currentQueryParam : urlQueryParams[queryParamName];
    const identity = v => v;
    const parser = parse || identity;
    return parser(initialValue);
  }

  handleChangedValue(useHistoryPush, format) {
    const { urlQueryParams, history } = this.props;
    const identity = v => v;
    const formatter = format || identity;

    return (urlParam, value) => {
      const updater = prevState => {
        const mergedQueryParams = { ...urlQueryParams, ...prevState.currentQueryParams };
        const updatedURLParam = value ? formatter(value) : null;
        return { currentQueryParams: { ...mergedQueryParams, [urlParam]: updatedURLParam } };
      };

      const callback = () => {
        if (useHistoryPush) {
          const search = this.state.currentQueryParams;
          history.push(createResourceLocatorString('SearchPage', routeConfiguration(), {}, search));
        }
      };

      this.setState(updater, callback);
    };
  }

  handleSortBy(urlParam, values) {
    const { history, urlQueryParams } = this.props;
    const queryParams = values
      ? { ...urlQueryParams, [urlParam]: values }
      : omit(urlQueryParams, urlParam);

    history.push(createResourceLocatorString('SearchPage', routeConfiguration(), {}, queryParams));
  }

  render() {
    const {
      className,
      rootClassName,
      urlQueryParams,
      sort,
      listings,
      searchInProgress,
      searchListingsError,
      searchParamsAreInSync,
      onActivateListing,
      onManageDisableScrolling,
      onOpenModal,
      onCloseModal,
      onMapIconClick,
      pagination,
      searchParamsForPagination,
      showAsModalMaxWidth,
      filterConfig,
      sortConfig,
    } = this.props;

    const primaryFilters = filterConfig.filter(f => f.group === 'primary');
    const secondaryFilters = filterConfig.filter(f => f.group !== 'primary');
    const hasSecondaryFilters = !!(secondaryFilters && secondaryFilters.length > 0);

    // Selected aka active filters
    const selectedFilters = validFilterParams(urlQueryParams, filterConfig);
    const selectedFiltersCount = Object.keys(selectedFilters).length;

    // Selected aka active secondary filters
    const selectedSecondaryFilters = hasSecondaryFilters
      ? validFilterParams(urlQueryParams, secondaryFilters)
      : {};
    const searchFiltersPanelSelectedCount = Object.keys(selectedSecondaryFilters).length;

    const isSearchFiltersPanelOpen = !!hasSecondaryFilters && this.state.isSearchFiltersPanelOpen;
    const propsForSecondaryFiltersToggle = hasSecondaryFilters
      ? {
          isSearchFiltersPanelOpen: this.state.isSearchFiltersPanelOpen,
          toggleSearchFiltersPanel: isOpen => {
            this.setState({ isSearchFiltersPanelOpen: isOpen });
          },
          searchFiltersPanelSelectedCount,
        }
      : {};

    const hasPaginationInfo = !!pagination && pagination.totalItems != null;
    const totalItems = searchParamsAreInSync && hasPaginationInfo ? pagination.totalItems : 0;
    const listingsAreLoaded = !searchInProgress && searchParamsAreInSync && hasPaginationInfo;

    const sortBy = mode => {
      const conflictingFilterActive = findActiveFilter(
        sortConfig.conflictingFilters,
        urlQueryParams,
        filterConfig
      );

      const mobileClassesMaybe =
        mode === 'mobile'
          ? {
              rootClassName: css.sortBy,
              menuLabelRootClassName: css.sortByMenuLabel,
            }
          : {};
      return sortConfig.active ? (
        <SortBy
          {...mobileClassesMaybe}
          sort={sort}
          isConflictingFilterActive={!!conflictingFilterActive}
          onSelect={this.handleSortBy}
          showAsPopup
          contentPlacementOffset={FILTER_DROPDOWN_OFFSET}
        />
      ) : null;
    };

    const classes = classNames(rootClassName || css.searchResultContainer, className);

    return (
      <div className={classes}>
        <SearchFilters
          className={css.searchFilters}
          sortByComponent={sortBy('desktop')}
          listingsAreLoaded={listingsAreLoaded}
          resultsCount={totalItems}
          searchInProgress={searchInProgress}
          searchListingsError={searchListingsError}
          {...propsForSecondaryFiltersToggle}
        >
          {primaryFilters.map(config => {
            return (
              <FilterComponent
                key={`SearchFilters.${config.id}`}
                idPrefix="SearchFilters"
                filterConfig={config}
                urlQueryParams={urlQueryParams}
                initialValue={this.initialValue}
                handleChangedValue={this.handleChangedValue}
                showAsPopup
                contentPlacementOffset={FILTER_DROPDOWN_OFFSET}
              />
            );
          })}
        </SearchFilters>
        <SearchFiltersMobile
          className={css.searchFiltersMobile}
          urlQueryParams={urlQueryParams}
          sortByComponent={sortBy('mobile')}
          listingsAreLoaded={listingsAreLoaded}
          resultsCount={totalItems}
          searchInProgress={searchInProgress}
          searchListingsError={searchListingsError}
          showAsModalMaxWidth={showAsModalMaxWidth}
          onMapIconClick={onMapIconClick}
          onManageDisableScrolling={onManageDisableScrolling}
          onOpenModal={onOpenModal}
          onCloseModal={onCloseModal}
          resetAll={this.resetAll}
          selectedFiltersCount={selectedFiltersCount}
        >
          {filterConfig.map(config => {
            return (
              <FilterComponent
                key={`SearchFiltersMobile.${config.id}`}
                idPrefix="SearchFiltersMobile"
                filterConfig={config}
                urlQueryParams={urlQueryParams}
                initialValue={this.initialValue}
                handleChangedValue={this.handleChangedValue}
                liveEdit
                showAsPopup={false}
              />
            );
          })}
        </SearchFiltersMobile>
        {isSearchFiltersPanelOpen ? (
          <div className={classNames(css.searchFiltersPanel)}>
            <SearchFiltersPanel
              urlQueryParams={urlQueryParams}
              listingsAreLoaded={listingsAreLoaded}
              applyFilters={this.applyFilters}
              cancelFilters={this.cancelFilters}
              resetAll={this.resetAll}
              onClosePanel={() => this.setState({ isSearchFiltersPanelOpen: false })}
            >
              {secondaryFilters.map(config => {
                return (
                  <FilterComponent
                    key={`SearchFiltersMobile.${config.id}`}
                    idPrefix="SearchFiltersPanel"
                    filterConfig={config}
                    urlQueryParams={urlQueryParams}
                    initialValue={this.initialValue}
                    handleChangedValue={this.handleChangedValue}
                    showAsPopup={false}
                  />
                );
              })}
            </SearchFiltersPanel>
          </div>
        ) : (
          <div
            className={classNames(css.listings, {
              [css.newSearchInProgress]: !listingsAreLoaded,
            })}
          >
            {searchListingsError ? (
              <h2 className={css.error}>
                <FormattedMessage id="SearchPage.searchError" />
              </h2>
            ) : null}
            <SearchResultsPanel
              className={css.searchListingsPanel}
              listings={listings}
              pagination={listingsAreLoaded ? pagination : null}
              search={searchParamsForPagination}
              setActiveListing={onActivateListing}
            />
          </div>
        )}
      </div>
    );
  }
}

MainPanel.defaultProps = {
  className: null,
  rootClassName: null,
  listings: [],
  resultsCount: 0,
  pagination: null,
  searchParamsForPagination: {},
  filterConfig: config.custom.filters,
  sortConfig: config.custom.sortConfig,
};

MainPanel.propTypes = {
  className: string,
  rootClassName: string,

  urlQueryParams: object.isRequired,
  listings: array,
  searchInProgress: bool.isRequired,
  searchListingsError: propTypes.error,
  searchParamsAreInSync: bool.isRequired,
  onActivateListing: func.isRequired,
  onManageDisableScrolling: func.isRequired,
  onOpenModal: func.isRequired,
  onCloseModal: func.isRequired,
  onMapIconClick: func.isRequired,
  pagination: propTypes.pagination,
  searchParamsForPagination: object,
  showAsModalMaxWidth: number.isRequired,
  filterConfig: propTypes.filterConfig,
  sortConfig: propTypes.sortConfig,

  history: shape({
    push: func.isRequired,
  }).isRequired,
};

export default MainPanel;
