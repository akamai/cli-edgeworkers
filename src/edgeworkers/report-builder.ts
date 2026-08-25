import {ewJsonOutput} from './client-manager';

interface Execution {
  invocations: number
  execDuration?: Record<string, number>,
  initDuration?: Record<string, number>,
  status?: string,
  memory?: Record<string, number>,
}

interface ExecutionForReport3 {
  startDateTime: string,
  edgeWorkerVersion: string,
  invocations: number,
  status?: string,
  continueOnErrorApplied?: number,
  continueOnErrorNotApplied?: number
}

interface ReportEightCustomer {
  customerName: string,
  vcds?: Array<{ vcd: number | string }>,
  errors?: {
    continueOnErrorApplied?: number,
    continueOnErrorNotApplied?: number,
    total?: number
  },
  execDuration?: Record<string, number>,
  initDuration?: Record<string, number>,
  invocations?: { total?: number },
  memory?: Record<string, number>,
  successes?: { total?: number },
  subRequests?: { total?: number }
}

interface SubRequestStatistics {
  avg?: number,
  min?: number,
  max?: number,
  twentyFivePercentile?: number,
  fiftyPercentile?: number,
  seventyFivePercentile?: number,
  ninetyFivePercentile?: number,
  ninetyNinePercentile?: number
}

interface SubRequestStatusBreakdown {
  httpStatus: number,
  invocations?: number,
  errorCount?: number,
  timeoutCount?: number,
  wallTime?: SubRequestStatistics,
  responseBodySize?: SubRequestStatistics
}

interface SubRequestRecord {
  hostname: string,
  invocations?: number,
  errorCount?: number,
  timeoutCount?: number,
  wallTime?: SubRequestStatistics,
  responseBodySize?: SubRequestStatistics,
  statusCodeBreakdown?: Array<SubRequestStatusBreakdown>
}

// Counts formatting helpers.
export function formatCountShort(count: number | string = 0, decimals = 2) {
  count = Number(count);
  if (count === 0) {
    return '0';
  }

  const units = ['', 'k', 'M', 'B', 'T'];
  const unitIndex = Math.min(Math.floor(Math.log10(Math.abs(count)) / 3), units.length - 1);
  const scale = Math.pow(10, unitIndex * 3);
  const value = unitIndex === 0 ? count : count / scale;

  return `${Number(value.toFixed(Math.max(decimals, 0)))}${units[unitIndex] ? ` ${units[unitIndex]}` : ''}`;
}

export const formatRate = (count = 0, total = 0) => {
  const rate = total > 0 ? (count / total) * 100 : 0;
  return `${rate.toFixed(2)} %`;
};

function formatDuration(value?: number) {
  if (value == null) {
    return 'N/A';
  }

  const absoluteValue = Math.abs(value);
  let formattedValue = value;
  let unit = 'ms';

  if (absoluteValue >= 3600000) {
    formattedValue = value / 3600000;
    unit = 'h';
  } else if (absoluteValue >= 60000) {
    formattedValue = value / 60000;
    unit = 'min';
  } else if (absoluteValue >= 1000) {
    formattedValue = value / 1000;
    unit = 's';
  }

  return `${formattedValue.toFixed(2)} ${unit}`;
}

export const formatMemory = (value?: number) => {
  if (value == null) {
    return 'N/A';
  }

  if (value === 0) {
    return '0.00 B';
  }

  const units = ['B', 'kB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / Math.pow(1024, unitIndex);

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

export function formatResponseBodySize(value?: number) {
  if (value == null) {
    return 'N/A';
  }

  if (value === 0) {
    return '0.00 B';
  }

  const units = ['B', 'kB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(Math.floor(Math.log(value) / Math.log(1000)), units.length - 1);
  const size = value / Math.pow(1000, unitIndex);

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export const getCustomerLabel = ({customerName, vcds}: ReportEightCustomer) => {
  const customerVcds = (vcds || []).map(({vcd}) => vcd).join(',');
  return customerVcds ? `${customerName} (${customerVcds})` : customerName;
};

const getExecutionAverages = (executionArray: Array<Execution>, executionKey: string) => {
  if (executionArray) {
    let totalAvg = 0, totalInvocations = 0, eventMax = -1, eventMin = Number.MAX_SAFE_INTEGER;
    for (const execution of executionArray) {
      const {avg, min, max} = execution[executionKey];

      totalAvg += avg * execution.invocations;
      totalInvocations += execution.invocations;
      eventMin = Math.min(eventMin, min);
      eventMax = Math.max(eventMax, max);
    }
    return {
      avg: (totalAvg / totalInvocations).toFixed(4),
      min: eventMin.toFixed(2),
      max: eventMax.toFixed(2)
    };
  } else {
    return {
      avg: 'N/A',
      min: 'N/A',
      max: 'N/A'
    };
  }
};

function formatAverageResult(result: {avg: string, min: string, max: string}, formatter: (value?: number) => string) {
  if (result.avg === 'N/A') {
    return result;
  }

  return {
    avg: formatter(Number(result.avg)),
    min: formatter(Number(result.min)),
    max: formatter(Number(result.max))
  };
}

function buildReportOne(report) {
  // summary
  const {
    memory,
    initDuration,
    execDuration,
    wallTimeInitDuration,
    wallTimeExecDuration,
    successes,
    errors,
    invocations
  } = report.data;

  const initDurationMapped = formatStatistics(initDuration, formatDuration);
  const execDurationMapped = formatStatistics(execDuration, formatDuration);
  const wallTimeInitDurationMapped = formatStatistics(wallTimeInitDuration, formatDuration);
  const wallTimeExecDurationMapped = formatStatistics(wallTimeExecDuration, formatDuration);
  const memoryMapped = formatStatistics(memory, formatMemory);

  if (errors?.continueOnErrorApplied || errors?.continueOnErrorNotApplied) {
    return [
      {successes: {total: formatCountShort(successes?.total)}, invocations: {total: formatCountShort(invocations?.total)}},
      {errors: formatCountRecord(errors)},
      {initDuration: initDurationMapped, execDuration: execDurationMapped},
      {wallTimeInitDuration: wallTimeInitDurationMapped, wallTimeExecDuration: wallTimeExecDurationMapped},
      {memory: memoryMapped},
    ];
  } else {
    return [
      {
        successes: {total: formatCountShort(successes?.total)},
        errors: {total: formatCountShort(errors?.total)},
        invocations: {total: formatCountShort(invocations?.total)}
      },
      {initDuration: initDurationMapped, execDuration: execDurationMapped},
      {wallTimeInitDuration: wallTimeInitDurationMapped, wallTimeExecDuration: wallTimeExecDurationMapped},
      {memory: memoryMapped},
    ];
  }
}

function buildReportTwo(report, executionEventHandlers: Array<string>) {
  // execution time
  const reportOutput = {};
  const executionCategories: Record<string, Array<Execution>> = report.data[0].data;

  for (const event of executionEventHandlers) {
    reportOutput[event] = getExecutionAverages(executionCategories[event], 'execDuration');
  }

  // execution time has an additional property for init times
  reportOutput['init'] = getExecutionAverages(executionCategories['init'], 'initDuration');

  return reportOutput;
}

function buildReportThree(report) {
  // execution status
  let reportOutput = {};
  const executionCategories: Record<string, Array<ExecutionForReport3>> = report.data[0].data;
  const errors = {invocations: 0, continueOnErrorApplied: 0, continueOnErrorNotApplied: 0};

  for (const executionArray of Object.values(executionCategories)) {
    for (const execution of executionArray) {
      const {status, invocations} = execution;
      reportOutput[status] = reportOutput[status] + invocations || invocations;
      if (status !== 'success' && status !== 'unimplementedEventHandler') {
        errors.invocations += invocations;
        if (execution.continueOnErrorApplied) {
          errors['continueOnErrorApplied'] = (errors['continueOnErrorApplied'] || 0) + execution.continueOnErrorApplied;
        }
        if (execution.continueOnErrorNotApplied) {
          errors['continueOnErrorNotApplied'] = (errors['continueOnErrorNotApplied'] || 0) + execution.continueOnErrorNotApplied;
        }
      }
    }
  }

  if (!reportOutput['success']) {
    // add success count if no successful executions
    reportOutput['success'] = 0;
  }

  if (errors?.continueOnErrorApplied || errors?.continueOnErrorNotApplied) {
    reportOutput = [formatCountRecord(reportOutput), {errors: formatCountRecord(errors)}];
  } else {
    //add property for total errors
    reportOutput['errors'] = errors.invocations;
    reportOutput = formatCountRecord(reportOutput);
  }
  return reportOutput;
}

function buildReportFour(report, executionEventHandlers: Array<string>) {
  // memory usage
  const reportOutput = {};
  const executionCategories: Record<string, Array<Execution>> = report.data[0].data;

  for (const event of executionEventHandlers) {
    reportOutput[event] = getExecutionAverages(executionCategories[event], 'memory');
  }
  return reportOutput;
}

function buildReportFive(report, executionEventHandlers: Array<string>) {
  // execution time
  const reportOutput = {};
  const executionCategories: Record<string, Array<Execution>> = report.data[0].data;

  for (const event of executionEventHandlers) {
    reportOutput[event] = formatAverageResult(getExecutionAverages(executionCategories[event], 'execDuration'), formatDuration);
  }

  // execution time has an additional property for init times
  reportOutput['init'] = formatAverageResult(getExecutionAverages(executionCategories['init'], 'initDuration'), formatDuration);
  return reportOutput;
}

function buildReportSix(report, executionEventHandlers: Array<string>) {
  // memory usage
  const reportOutput = {};
  const executionCategories: Record<string, Array<Execution>> = report.data[0].data;

  for (const event of executionEventHandlers) {
    reportOutput[event] = formatAverageResult(getExecutionAverages(executionCategories[event], 'memory'), formatMemory);
  }
  return reportOutput;
}

function buildReportSeven(report) {
  const {subRequests} = report.data;
  return [
    {subRequests: {total: formatCountShort(subRequests.total)}},
    {
      errors: {
        total: formatCountShort(subRequests.errors?.total),
        errorCount: formatCountShort(subRequests.errors?.errorCount),
        timeoutCount: formatCountShort(subRequests.errors?.timeoutCount)
      }
    },
    {
      responseBodySize: formatStatistics(subRequests.responseBodySize, formatResponseBodySize),
      wallTime: formatStatistics(subRequests.wallTime, formatDuration)
    }
  ];
}

function formatCountRecord(record: Record<string, number | undefined>) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, formatCountShort(value)]));
}

function formatStatistics(statistics: SubRequestStatistics | undefined, formatter: (value?: number) => string) {
  if (!statistics) {
    return {avg: 'N/A', min: 'N/A', max: 'N/A'};
  }

  return {
    avg: formatter(statistics.avg),
    min: formatter(statistics.min),
    max: formatter(statistics.max)
  };
};

function getSubRequestRows(report): Array<SubRequestRecord> {
  return (report.data || [])
    .flatMap((edgeWorker) => Object.values(edgeWorker.data || {}) as Array<Array<SubRequestRecord>>)
    .flat();
}

export function sortSubRequestRows(rows: Array<Record<string, unknown>>) {
  return rows.sort((rowA, rowB) => {
  const hostnameComparison = String(rowA.Hostname).localeCompare(String(rowB.Hostname));
  if (hostnameComparison !== 0) {
    return hostnameComparison;
  }

  const statusA = Number(rowA['HTTP Status']);
  const statusB = Number(rowB['HTTP Status']);
  if (!Number.isNaN(statusA) && !Number.isNaN(statusB)) {
    return statusA - statusB;
  }

  return String(rowA['HTTP Status Class']).localeCompare(String(rowB['HTTP Status Class']));
  });
}

function sortSummaryStatisticsRows(rows: Array<Record<string, unknown>>) {
  return rows.sort((rowA, rowB) => Number(rowA['HTTP Status']) - Number(rowB['HTTP Status']));
}

function getStatusRowKey(hostname: string, httpStatus: number) {
  return `${hostname}\u0000${httpStatus}`;
}

export function aggregateReportTenRows(rows: Array<Record<string, unknown>>) {
  const aggregated = new Map<string, Record<string, unknown>>();

  for (const row of rows) {
    const key = getStatusRowKey(String(row.Hostname), Number(row['HTTP Status']));
    const existing = aggregated.get(key);
    if (!existing) {
      aggregated.set(key, {...row});
      continue;
    }

    existing.Invocations = Number(existing.Invocations || 0) + Number(row.Invocations || 0);
    existing['Error Count'] = Number(existing['Error Count'] || 0) + Number(row['Error Count'] || 0);
    existing['Timeout Count'] = Number(existing['Timeout Count'] || 0) + Number(row['Timeout Count'] || 0);
  }

  return [...aggregated.values()];
}

function buildReportTen(report) {
  const rows = getSubRequestRows(report).flatMap((record) => (record.statusCodeBreakdown || []).map((status) => ({
    Hostname: record.hostname,
    'HTTP Status': status.httpStatus,
    Invocations: status.invocations,
    'Error Count': status.errorCount,
    'Timeout Count': status.timeoutCount
  })));

  return [sortSubRequestRows(aggregateReportTenRows(rows).map((row) => ({
    ...row,
    Invocations: formatCountShort(row.Invocations as number),
    'Error Count': formatCountShort(row['Error Count'] as number),
    'Timeout Count': formatCountShort(row['Timeout Count'] as number)
  })))] ;
}

export function aggregateExactStatisticsRows(rows: Array<Record<string, unknown>>) {
  const aggregated = new Map<string, { row: Record<string, unknown>, invocations: number }>();

  for (const row of rows) {
    const key = getStatusRowKey(String(row.Hostname), Number(row['HTTP Status']));
    const statistics = row.statistics as SubRequestStatistics;
    const invocations = Number(row.invocations || 0);
    const existing = aggregated.get(key);

    if (!existing) {
      aggregated.set(key, {
        row: {
          Hostname: row.Hostname,
          'HTTP Status': row['HTTP Status'],
          avg: statistics?.avg,
          min: statistics?.min,
          max: statistics?.max
        },
        invocations
      });
      continue;
    }

    const totalInvocations = existing.invocations + invocations;
    existing.row.avg = existing.row.avg == null || invocations === 0
      ? existing.row.avg ?? statistics?.avg
      : ((Number(existing.row.avg) * existing.invocations) + (Number(statistics?.avg || 0) * invocations)) / totalInvocations;
    existing.row.min = Math.min(Number(existing.row.min ?? Number.MAX_VALUE), Number(statistics?.min ?? Number.MAX_VALUE));
    existing.row.max = Math.max(Number(existing.row.max ?? Number.MIN_VALUE), Number(statistics?.max ?? Number.MIN_VALUE));
    existing.invocations += invocations;
  }

  return [...aggregated.values()].map(({row}) => row);
}

export function formatClassPercentiles(statistics: SubRequestStatistics | undefined, formatter: (value?: number) => string) {
  return {
    p25: formatter(statistics?.twentyFivePercentile),
    p50: formatter(statistics?.fiftyPercentile),
    p75: formatter(statistics?.seventyFivePercentile),
    p95: formatter(statistics?.ninetyFivePercentile),
    p99: formatter(statistics?.ninetyNinePercentile)
  };
}

function buildReportWithSubRequestStatistics(
  report,
  property: 'wallTime' | 'responseBodySize',
  exactFormatter: (value?: number) => string,
  summaryFormatter: (value?: number) => string = exactFormatter
) {
  const records = (report.data || []).flatMap((edgeWorker) => Object.entries(edgeWorker.data || {})
    .flatMap(([statusClass, classRecords]) => (classRecords as Array<SubRequestRecord>)
      .map((record) => ({
        statusClass,
        record
      }))));
  const exactRows = records.flatMap(({record}) => (record.statusCodeBreakdown || []).map((status) => ({
    Hostname: record.hostname,
    'HTTP Status': status.httpStatus,
    statistics: status[property],
    invocations: status.invocations
  })));

  const exactTable = aggregateExactStatisticsRows(exactRows).map((row) => ({
    Hostname: row.Hostname,
    'HTTP Status': row['HTTP Status'],
    avg: exactFormatter(row.avg as number),
    min: exactFormatter(row.min as number),
    max: exactFormatter(row.max as number)
  }));
  const aggregateKey = property === 'wallTime' ? 'totalWallTime' : 'totalResponseBodySize';
  const summaryTable = Object.entries(report.summaryStatistics || {})
    .filter(([status]) => status !== aggregateKey)
    .map(([status, statistics]) => ({
      'HTTP Status': Number(status),
      ...formatClassPercentiles(statistics as SubRequestStatistics, summaryFormatter)
    }));

  return [sortSubRequestRows(exactTable), sortSummaryStatisticsRows(summaryTable)];
}

function buildReportEight(report) {
  const customers: Array<ReportEightCustomer> = [...(report.data || [])]
    .sort((customerA, customerB) => customerA.customerName.localeCompare(customerB.customerName));

  const summaryTable = customers.map((customer) => {
    const successCount = customer.successes?.total || 0;
    const errorCount = customer.errors?.total || 0;
    const invocationCount = customer.invocations?.total || 0;

    return {
      'Customer Name (VCDs)': getCustomerLabel(customer),
      'Success Count': formatCountShort(successCount),
      'Error Count': formatCountShort(errorCount),
      'Error Rate': formatRate(errorCount, invocationCount),
      'COE Applied': formatCountShort(customer.errors?.continueOnErrorApplied || 0),
      'COE Not Applied': formatCountShort(customer.errors?.continueOnErrorNotApplied || 0),
      'Sub-request Count': formatCountShort(customer.subRequests?.total || 0)
    };
  });

  const performanceTable = customers.map((customer) => ({
    'Customer Name (VCDs)': getCustomerLabel(customer),
    'Avg CPU Time': formatDuration(customer.execDuration?.avg),
    'Max CPU Time': formatDuration(customer.execDuration?.max),
    'Avg Init Time': formatDuration(customer.initDuration?.avg),
    'Max Init Time': formatDuration(customer.initDuration?.max),
    'Avg Mem Usage': formatMemory(customer.memory?.avg),
    'Max Mem Usage': formatMemory(customer.memory?.max)
  }));

  return [summaryTable, performanceTable];
}

function buildReportNine(report, executionEventHandlers: Array<string>) {
  // wall time
  const reportOutput = {};
  const executionCategories: Record<string, Array<Execution>> = report.data[0].data;

  for (const event of executionEventHandlers) {
    reportOutput[event] = getExecutionAverages(executionCategories[event], 'wallTimeExecDuration');
  }

  // wall time has an additional property for init times
  reportOutput['init'] = getExecutionAverages(executionCategories['init'], 'wallTimeInitDuration');
  return reportOutput;
}

export function writeReportOutputToConsole(report, executionEventHandlers: Array<string>, msg: string) {
  let reportOutput;

  switch (report.reportId) {
    case 1: {
      reportOutput = buildReportOne(report);
      break;
    }
    case 2: {
      reportOutput = buildReportTwo(report, executionEventHandlers);
      break;
    }
    case 3: {
      reportOutput = buildReportThree(report);
      break;
    }
    case 4: {
      reportOutput = buildReportFour(report, executionEventHandlers);
      break;
    }
    case 5: {
      reportOutput = buildReportFive(report, executionEventHandlers);
      break;
    }
    case 6: {
      reportOutput = buildReportSix(report, executionEventHandlers);
      break;
    }
    case 7: {
      reportOutput = buildReportSeven(report);
      break;
    }
    case 8: {
      reportOutput = buildReportEight(report);
      break;
    }
    case 9: {
      reportOutput = buildReportNine(report, executionEventHandlers);
      break;
    }
    case 10: {
      reportOutput = buildReportTen(report);
      break;
    }
    case 11: {
      reportOutput = buildReportWithSubRequestStatistics(report, 'wallTime', formatDuration);
      break;
    }
    case 12: {
      reportOutput = buildReportWithSubRequestStatistics(report, 'responseBodySize', formatMemory, formatResponseBodySize);
      break;
    }
  }
  if (ewJsonOutput.isJSONOutputMode()) {
    ewJsonOutput.writeJSONOutput(0, msg, reportOutput);
  } else {
    if (Array.isArray(reportOutput)) {
      // report 1 (summary) will return an array of table objects
      reportOutput.forEach((table) => console.table(table));
    } else {
      console.table(reportOutput);
    }
  }
}
