import * as ScrollArea from '@radix-ui/react-scroll-area'
import { datasetLabels } from '../features/sampler/constants'
import type { DatasetKind, SourceEntry } from '../features/sampler/types'

interface DatasetOverviewProps {
  datasets: Record<DatasetKind, SourceEntry[]>
}

export function DatasetOverview({ datasets }: DatasetOverviewProps) {
  return (
    <ScrollArea.Root className="table-scroll">
      <ScrollArea.Viewport>
        <table className="data-table">
          <thead>
            <tr>
              <th>Dataset</th>
              <th>Rows</th>
              <th>Bad actor rows</th>
              <th>Preview</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(datasets).map(([kind, values]) => (
              <tr key={kind}>
                <td>{datasetLabels[kind as DatasetKind]}</td>
                <td>{values.length}</td>
                <td>{values.filter((entry) => entry.isBadActor).length}</td>
                <td>{values.slice(0, 3).map((entry) => entry.value).join(', ') || 'No data loaded'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="scrollbar" orientation="vertical">
        <ScrollArea.Thumb className="scrollbar__thumb" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
}
