'use client';

/**
 * Client component for handling sorting options with event handlers
 */
export default function SortingOptions({
  currentSort,
  currentOrder,
  baseUrl
}: {
  currentSort: string;
  currentOrder: string;
  baseUrl: string;
}) {
  const sortOptions = [
    { value: 'year', label: 'Year' },
    { value: 'title', label: 'Title' },
  ];

  const orderOptions = [
    { value: 'desc', label: 'Descending' },
    { value: 'asc', label: 'Ascending' },
  ];

  const makeUrl = (sort: string, order: string) => {
    return `${baseUrl}?sort=${sort}&order=${order}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center space-x-2">
        <label htmlFor="sort-select" className="text-sm text-gray-600">
          Sort by:
        </label>
        <select
          id="sort-select"
          className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          value={currentSort}
          onChange={(e) => {
            window.location.href = makeUrl(e.target.value, currentOrder);
          }}
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <label htmlFor="order-select" className="text-sm text-gray-600">
          Order:
        </label>
        <select
          id="order-select"
          className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          value={currentOrder}
          onChange={(e) => {
            window.location.href = makeUrl(currentSort, e.target.value);
          }}
        >
          {orderOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
