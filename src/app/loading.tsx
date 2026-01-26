const METRIC_CARD_COUNT = 4;
const CHART_COUNT = 2;
const TABLE_COUNT = 2;
const CHART_BAR_COUNT = 5;
const TABLE_ROW_COUNT = 5;

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingHeader />
        <LoadingMetrics />
        <LoadingCharts />
        <LoadingTables />
      </div>
    </div>
  );
}

function LoadingHeader() {
  return (
    <div className="mb-8">
      <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-96 mt-2 animate-pulse"></div>
    </div>
  );
}

function LoadingMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(METRIC_CARD_COUNT)].map((_, index) => (
        <LoadingMetricCard key={index} />
      ))}
    </div>
  );
}

function LoadingMetricCard() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      <div className="h-8 bg-gray-200 rounded w-16 mt-2 animate-pulse"></div>
    </div>
  );
}

function LoadingCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {[...Array(CHART_COUNT)].map((_, index) => (
        <LoadingChart key={index} />
      ))}
    </div>
  );
}

function LoadingChart() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-4"></div>
      <LoadingChartBars />
    </div>
  );
}

function LoadingChartBars() {
  return (
    <div className="space-y-2">
      {[...Array(CHART_BAR_COUNT)].map((_, index) => (
        <LoadingChartBar key={index} />
      ))}
    </div>
  );
}

function LoadingChartBar() {
  return (
    <div className="flex justify-between items-center">
      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
    </div>
  );
}

function LoadingTables() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {[...Array(TABLE_COUNT)].map((_, index) => (
        <LoadingTable key={index} />
      ))}
    </div>
  );
}

function LoadingTable() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-4"></div>
      <LoadingTableRows />
    </div>
  );
}

function LoadingTableRows() {
  return (
    <div className="space-y-2">
      {[...Array(TABLE_ROW_COUNT)].map((_, index) => (
        <LoadingTableRow key={index} />
      ))}
    </div>
  );
}

function LoadingTableRow() {
  return (
    <div className="flex justify-between items-center text-sm">
      <LoadingTableRowContent />
      <LoadingTableRowPrice />
    </div>
  );
}

function LoadingTableRowContent() {
  return (
    <div className="flex space-x-2">
      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
    </div>
  );
}

function LoadingTableRowPrice() {
  return (
    <div className="text-right">
      <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
      <div className="h-3 bg-gray-200 rounded w-8 animate-pulse mt-1"></div>
    </div>
  );
}
