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
  vcds?: Array<{vcd: number | string}>,
  errors?: {
    continueOnErrorApplied?: number,
    continueOnErrorNotApplied?: number,
    total?: number
  },
  execDuration?: Record<string, number>,
  initDuration?: Record<string, number>,
  invocations?: {total?: number},
  memory?: Record<string, number>,
  successes?: {total?: number},
  subRequests?: {total?: number}
}

// Report 8 formatting helpers.
// Force US-style thousands separators so counts match CLI examples like 211,840.
const formatCount = (value = 0) => value.toLocaleString('en-US');

export const formatRate = (count = 0, total = 0) => {
  const rate = total > 0 ? (count / total) * 100 : 0;
  return `${rate.toFixed(2)} %`;
};

const formatDuration = (value?: number) => value == null ? 'N/A' : `${value.toFixed(2)} ms`;

export const formatMemory = (value?: number) => {
  if (value == null) {
    return 'N/A';
  }

  if (value < 1024) {
    return `${value.toFixed(0)} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB'];
  let unitIndex = -1;
  let size = value;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};


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

function buildReportOne(report) {
  // summary
  const {
    memory,
    initDuration,
    execDuration,
    successes,
    errors,
    invocations
  } = report.data;

  let initDurationMapped = {}; // init duration might be undefined
  let execDurationMapped = {};
  let memoryMapped = {};

  if (initDuration) {
    Object.keys(initDuration).forEach((key) => {
      initDurationMapped[key] = initDuration[key].toFixed(4);
    });
  } else {
    initDurationMapped = {avg: 'N/A', max: 'N/A', min: 'N/A'};
  }

  if (execDuration) {
    Object.keys(execDuration).forEach((key) => {
      execDurationMapped[key] = execDuration[key].toFixed(4);
    });
  } else {
    execDurationMapped = {avg: 'N/A', max: 'N/A', min: 'N/A'};
  }

  if (memory) {
    Object.keys(memory).forEach((key) => {
      memoryMapped[key] = memory[key].toFixed(4);
    });
  } else {
    memoryMapped = {avg: 'N/A', max: 'N/A', min: 'N/A'};
  }

  if (errors?.continueOnErrorApplied || errors?.continueOnErrorNotApplied) {
    return [
      {successes: {total: successes?.total}, invocations: {total: invocations?.total}},
      {errors},
      {initDuration: initDurationMapped, execDuration: execDurationMapped},
      {memory: memoryMapped},
    ];
  } else {
    return [
      {
        successes: {total: successes?.total},
        errors: {total: errors?.total},
        invocations: {total: invocations?.total}
      },
      {initDuration: initDurationMapped, execDuration: execDurationMapped},
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
    reportOutput = [{...reportOutput}, {errors}];
  } else {
    //add property for total errors
    reportOutput['errors'] = errors.invocations;
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
    reportOutput[event] = getExecutionAverages(executionCategories[event], 'execDuration');
  }

  // execution time has an additional property for init times
  reportOutput['init'] = getExecutionAverages(executionCategories['init'], 'initDuration');
  return reportOutput;
}

function buildReportSix(report, executionEventHandlers: Array<string>) {
  // memory usage
  const reportOutput = {};
  const executionCategories: Record<string, Array<Execution>> = report.data[0].data;

  for (const event of executionEventHandlers) {
    reportOutput[event] = getExecutionAverages(executionCategories[event], 'memory');
  }
  return reportOutput;
}

function buildReportSeven(report) {
  // subrequests total
  const reportOutput = {};
  reportOutput['subRequests'] = {'total': report.data['subRequests']['total']};
  return reportOutput;
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
      'Success Count': formatCount(successCount),
      'Error Count': formatCount(errorCount),
      'Error Rate': formatRate(errorCount, invocationCount),
      'COE Applied': formatCount(customer.errors?.continueOnErrorApplied || 0),
      'COE Not Applied': formatCount(customer.errors?.continueOnErrorNotApplied || 0),
      'Sub-request Count': formatCount(customer.subRequests?.total || 0)
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

export function writeReportOutput(report, executionEventHandlers: Array<string>, msg: string) {
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
