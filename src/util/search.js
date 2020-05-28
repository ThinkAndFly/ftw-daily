export const parseSelectFilterOptions = uriComponentValue => {
  return uriComponentValue && uriComponentValue.indexOf(':') >= 0
    ? uriComponentValue.split(':')[1].split(',')
    : uriComponentValue && uriComponentValue.indexOf(':') < 0
    ? uriComponentValue.split(',')
    : [];
};

export const findActiveFilter = (filterIds, urlQueryParams, filterConfigs) => {
  const activeQueryParamKeys = filterConfigs
    .filter(config => filterIds.includes(config.id))
    .map(config => config.queryParamName);

  const queryParamKeys = Object.keys(urlQueryParams);
  const activeKey = queryParamKeys.find(k => activeQueryParamKeys.includes(k));
  return activeKey;
};

export const findOptionsForSelectFilter = (filterId, filters) => {
  const filter = filters.find(f => f.id === 'amenities');
  return filter && filter.config && filter.config.options ? filter.config.options : [];
};
