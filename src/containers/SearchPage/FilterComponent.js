import React from 'react';
import { parseDateFromISO8601, stringifyDateToISO8601 } from '../../util/dates';
import { parseSelectFilterOptions } from '../../util/search';
import {
  BookingDateRangeFilter,
  PriceFilter,
  KeywordFilter,
  SelectSingleFilter,
  SelectMultipleFilter,
} from '../../components';

const RADIX = 10;

/**
 * FilterComponent is used to map configured filter types
 * to actual filter components
 */
const FilterComponent = props => {
  const {
    idPrefix,
    filterConfig,
    urlQueryParams,
    initialValue,
    handleChangedValue,
    ...rest
  } = props;
  const { id, type, queryParamName, label, config } = filterConfig;
  const { liveEdit, showAsPopup } = rest;

  const useHistoryPush = liveEdit || showAsPopup;
  const prefix = idPrefix || 'SearchPage';
  const componentId = `${prefix}.${id.toLowerCase()}`;
  const name = id.replace(/\s+/g, '-').toLowerCase();

  switch (type) {
    case 'SelectSingleFilter': {
      return (
        <SelectSingleFilter
          id={componentId}
          label={label}
          urlParam={queryParamName}
          initialValue={initialValue(queryParamName)}
          onSelect={handleChangedValue(useHistoryPush)}
          {...config}
          {...rest}
        />
      );
    }
    case 'SelectMultipleFilter': {
      // Parse options from param strings like "has_all:a,b,c" or "a,b,c"
      const parse = parseSelectFilterOptions;
      // Format URI component's value: 'has_all:a,b,c'
      const format = selectedOptions => {
        const hasOptionsSelected = selectedOptions && selectedOptions.length > 0;
        const optionsForURIComponent = hasOptionsSelected ? selectedOptions.join(',') : null;
        const searchMode = config.searchMode ? `${config.searchMode}:` : '';
        return `${searchMode}${optionsForURIComponent}`;
      };
      return (
        <SelectMultipleFilter
          id={componentId}
          label={label}
          name={name}
          urlParam={queryParamName}
          initialValues={initialValue(queryParamName, parse)}
          onSubmit={handleChangedValue(useHistoryPush, format)}
          {...config}
          {...rest}
        />
      );
    }
    case 'BookingDateRangeFilter': {
      // Parse query parameter, which should look like "2020-05-28,2020-05-31"
      const parse = value => {
        const rawValuesFromParams = value ? value.split(',') : [];
        const [startDate, endDate] = rawValuesFromParams.map(v => parseDateFromISO8601(v));
        return value && startDate && endDate ? { dates: { startDate, endDate } } : { dates: null };
      };
      // Format dateRange value for the query. It's given by FieldDateRangeInput:
      // { dates: { startDate, endDate } }
      const format = dateRange => {
        const hasDates = dateRange && dateRange.dates;
        const { startDate, endDate } = hasDates ? dateRange.dates : {};
        const start = startDate ? stringifyDateToISO8601(startDate) : null;
        const end = endDate ? stringifyDateToISO8601(endDate) : null;
        return start && end ? `${start},${end}` : null;
      };
      return (
        <BookingDateRangeFilter
          id={componentId}
          label={label}
          urlParam={queryParamName}
          initialValues={initialValue(queryParamName, parse)}
          onSubmit={handleChangedValue(useHistoryPush, format)}
          {...config}
          {...rest}
        />
      );
    }
    case 'PriceFilter': {
      // Parse query parameter, which should look like "2020-05-28,2020-05-31"
      const parse = priceRange => {
        const [minPrice, maxPrice] = !!priceRange
          ? priceRange.split(',').map(v => Number.parseInt(v, RADIX))
          : [];
        // Note: we compare to null, because 0 as minPrice is falsy in comparisons.
        return !!priceRange && minPrice != null && maxPrice != null ? { minPrice, maxPrice } : null;
      };
      // Format value, which should look like { minPrice, maxPrice }
      const format = range => {
        const { minPrice, maxPrice } = range || {};
        // Note: we compare to null, because 0 as minPrice is falsy in comparisons.
        return minPrice != null && maxPrice != null ? `${minPrice},${maxPrice}` : null;
      };
      return (
        <PriceFilter
          id={componentId}
          label={label}
          urlParam={queryParamName}
          initialValues={initialValue(queryParamName, parse)}
          onSubmit={handleChangedValue(useHistoryPush, format)}
          {...config}
          {...rest}
        />
      );
    }
    case 'KeywordFilter':
      return (
        <KeywordFilter
          id={componentId}
          label={label}
          name={name}
          urlParam={queryParamName}
          initialValues={initialValue(queryParamName)}
          onSubmit={handleChangedValue(useHistoryPush)}
          {...config}
          {...rest}
        />
      );
    default:
      return null;
  }
};

export default FilterComponent;
