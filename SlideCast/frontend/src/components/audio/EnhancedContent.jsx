import { useState } from 'react'
import {
  LightBulbIcon,
  ChartBarIcon,
  NewspaperIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { Tab } from '@headlessui/react'

const EnhancedContent = ({
  additionalPoints = [],
  statistics = [],
  newsUpdates = [],
  notes = [],
  onAddNote,
  onEditNote,
  className = ''
}) => {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)
  const [newNote, setNewNote] = useState('')

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(newNote)
      setNewNote('')
    }
  }

  const categories = [
    {
      id: 'talking-points',
      name: 'Talking Points',
      icon: LightBulbIcon,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50'
    },
    {
      id: 'statistics',
      name: 'Statistics',
      icon: ChartBarIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'news',
      name: 'News Updates',
      icon: NewspaperIcon,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      id: 'notes',
      name: 'Notes',
      icon: PencilIcon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
        <Tab.List className="flex space-x-1 rounded-t-lg bg-gray-50 p-1">
          {categories.map((category) => (
            <Tab
              key={category.id}
              className={({ selected }) => `
                w-full rounded-lg py-2.5 text-sm font-medium leading-5
                ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400
                focus:outline-none focus:ring-2
                ${
                  selected
                    ? 'bg-white text-gray-700 shadow'
                    : 'text-gray-500 hover:bg-white/[0.12] hover:text-gray-600'
                }
              `}
            >
              <div className="flex items-center justify-center space-x-1">
                <category.icon className="h-4 w-4" />
                <span>{category.name}</span>
              </div>
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="p-4">
          {/* Talking Points Panel */}
          <Tab.Panel className="space-y-3">
            {additionalPoints.map((point, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg"
              >
                <LightBulbIcon className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{point}</p>
              </div>
            ))}
            {additionalPoints.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No additional talking points available
              </p>
            )}
          </Tab.Panel>

          {/* Statistics Panel */}
          <Tab.Panel className="space-y-3">
            {statistics.map((stat, index) => (
              <div
                key={index}
                className="p-3 bg-blue-50 rounded-lg"
              >
                <div className="flex items-center space-x-2 mb-1">
                  <ChartBarIcon className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {stat.fact}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Source: {stat.source}</span>
                  <span>{new Date(stat.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {statistics.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No statistics available
              </p>
            )}
          </Tab.Panel>

          {/* News Updates Panel */}
          <Tab.Panel className="space-y-3">
            {newsUpdates.map((news, index) => (
              <div
                key={index}
                className="p-3 bg-green-50 rounded-lg"
              >
                <div className="flex items-start space-x-3">
                  <NewspaperIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">
                      {news.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {news.summary}
                    </p>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <a
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline"
                      >
                        Read more
                      </a>
                      <span>{new Date(news.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {newsUpdates.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No news updates available
              </p>
            )}
          </Tab.Panel>

          {/* Notes Panel */}
          <Tab.Panel className="space-y-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 rounded-lg border-gray-200 text-sm focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 transition-colors"
              >
                Add
              </button>
            </div>
            
            {notes.map((note, index) => (
              <div
                key={index}
                className="p-3 bg-purple-50 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <PencilIcon className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700">{note.content}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onEditNote(index, note)}
                    className="p-1 hover:bg-purple-100 rounded"
                  >
                    <PencilIcon className="h-4 w-4 text-purple-500" />
                  </button>
                </div>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No notes yet
              </p>
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}

export default EnhancedContent
