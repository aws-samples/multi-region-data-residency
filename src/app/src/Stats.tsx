import {
    CheckCircleIcon, ExclamationTriangleIcon  } from '@heroicons/react/24/outline'

    
export default function Stats() {

    function classNames(...classes: any) {
        return classes.filter(Boolean).join(' ')
      }

    // TODO: Pull from Lambda/DynamoDB, mock data for UI prototype
    const stats = [
        { name: 'Receipts', value: '5', change: '+4.75%', changeType: 'positive' },
        { name: 'Health Sensor Events', value: '450', change: '+54.02%', changeType: 'negative' },
      ]

      const activity = [
        { id: 1, type: 'added', person: { name: 'Healthcare Receipt' }, date: '7d ago', dateTime: '2023-01-23T10:32' },
        { id: 2, type: 'deleted', person: { name: 'Healthcare Receipt' }, date: '6d ago', dateTime: '2023-01-23T11:03' },
        { id: 3, type: 'event sent', person: { name: 'IOT Sensor' }, date: '6d ago', dateTime: '2023-01-23T11:24' },
        { id: 4, type: 'event sent', person: { name: 'IOT Sensor' }, date: '2d ago', dateTime: '2023-01-24T09:12' },
        { id: 4, type: 'event deleted', person: { name: 'IOT Sensor' }, date: '2d ago', dateTime: '2023-01-24T09:12' },
        { id: 5, type: 'event sent', person: { name: 'IOT Sensor' }, date: '1d ago', dateTime: '2023-01-24T09:20' },
        { id: 6, type: 'updated', person: { name: 'Profile' }, date: '1d ago', dateTime: '2023-01-24T09:20' },
        { id: 6, type: 'event', person: { name: 'Login' }, date: 'now', dateTime: '2023-01-24T09:20' },
      ]

    return(
        <>
         {/* Stats */}

         <div className="rounded-md bg-yellow-50 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Demo Mode</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Welcome to the HelloHealth (Mock Startup) demonstration for multi-region data residency using AWS. The application demonstrates storing customer PII (Personally Identifiable Information) and PHI (Personal Health Information) in a geographicaly isolated region based on the users country of residence. The architecture includes Amazon Cognito for authentication, unique S3 buckets per region for file uploads and DynamoDB tables in each region for customers healthcare (PHI) data and profile (PII) data. For more information see the aws-samples Github repo.
            </p>
          </div>
        </div>
      </div>
    </div>

         <div className="border-b border-b-gray-900/10 lg:border lg:border-gray-900/5">
            <dl className="mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 lg:px-2 xl:px-0">
              {stats.map((stat, statIdx) => (
                <div
                  key={stat.name}
                  className={classNames(
                    statIdx % 2 === 1 ? 'sm:border-l' : statIdx === 2 ? 'lg:border-l' : '',
                    'flex items-baseline flex-wrap justify-between gap-y-2 gap-x-4 border-t border-gray-900/5 px-4 py-10 sm:px-6 lg:border-t-0 xl:px-8'
                  )}
                >
                  <dt className="text-sm font-medium leading-6 text-gray-500">{stat.name}</dt>
                  <dd
                    className={classNames(
                      stat.changeType === 'negative' ? 'text-rose-600' : 'text-gray-700',
                      'text-xs font-medium'
                    )}
                  >
                    {stat.change}
                  </dd>
                  <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>


          <div className="lg:col-start-3">
              {/* Activity feed */}
              <h1 className="mt-6 text-2xl font-semibold leading-6 text-gray-900">My Activity</h1>
              <ul role="list" className="mt-6 ml-8 space-y-6">
                {activity.map((activityItem, activityItemIdx) => (
                  <li key={activityItem.id} className="relative flex gap-x-4">
                    <div
                      className={classNames(
                        activityItemIdx === activity.length - 1 ? 'h-6' : '-bottom-6',
                        'absolute left-0 top-0 flex w-6 justify-center'
                      )}
                    >
                      <div className="w-px bg-gray-200" />
                    </div>
                    
                      <>
                        <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                          {activityItem.type === 'paid' ? (
                            <CheckCircleIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300" />
                          )}
                        </div>
                        <p className="flex-auto py-0.5 text-xs leading-5 text-gray-500">
                          <span className="font-medium text-gray-900">{activityItem.person.name}</span>{' '}
                          {activityItem.type}
                        </p>
                        <time
                          dateTime={activityItem.dateTime}
                          className="flex-none py-0.5 text-xs leading-5 text-gray-500"
                        >
                          {activityItem.date}
                        </time>
                      </>
                    
                  </li>
                ))}
              </ul>
            </div>

        </>
    )

}