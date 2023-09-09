import {
  UserCircleIcon,
  PhotoIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'

// TODO: Pull from Lambda/S3, mock data for UI prototype

const receipts = [
  { status: "Pending", name: "Happy Feet", category: 'Reflexology', date: '24th May 2023', id: 1 },
  { status: "Approved", name: "Phyiso First", category: 'Physiotherapy', date: '20th May 2023', id: 2 },
  { status: "Approved", name: "Vision Plus", category: 'Optometrist', date: '4th Feb 2023', id: 3 },
  { status: "Approved", name: "Smile Now", category: 'Dental', date: '1st Jan 2023', id: 4 },
]

export default function Receipt() {

  const [open, setOpen] = useState(false)

  const handleView = () => {

    setOpen(true)

    }

  return (

    <div>

<Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <div className="fixed inset-0" />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                    <div className="px-4 sm:px-6 pt-12 mt-4">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                          Receipt
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            onClick={() => setOpen(false)}
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">

                    <img src="/mock-receipt.png"/>

                    <h2 className="pt-2 text-base font-semibold leading-7 text-gray-900">Provider</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
              Happy Feet
            </p>

            <h2 className="pt-2 text-base font-semibold leading-7 text-gray-900">Category</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
            Reflexology
            </p>

            <h2 className="pt-2 text-base font-semibold leading-7 text-gray-900">Date</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
            24th May 2023
            </p>

            


                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>

      <form>
        <div className="space-y-12 sm:space-y-16">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900">Upload New Receipt</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
              Upload and manage your healthcare provider receipts for reimbursement.
            </p>

            <div className="mt-10 space-y-8 border-b border-gray-900/10 pb-12 sm:space-y-0 sm:divide-y sm:divide-gray-900/10 sm:border-t sm:pb-0">
              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
                  Provider
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                    <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm"></span>
                    <input
                      type="text"
                      name="provider"
                      id="provider"
                      autoComplete="provider"
                      className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                      placeholder="Provider name"
                    />
                  </div>
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
                  Category
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <div className="flex">
                    <select
                      id="country"
                      name="country"
                      autoComplete="country-name"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-s sm:text-sm sm:leading-6"
                    >
                      <option>General Dental</option>
                      <option>Major Dental</option>
                      <option>Physiotherapy & specialist therapies</option>
                      <option>Pharmaceuticals</option>
                      <option>Chiropractic & osteopathy</option>
                      <option>Clinical psychology & hypnotherapy</option>
                      <option>Therapies</option>
                      <option>Dietetics</option>
                      <option>Podiatry</option>
                      <option>Hearing aids</option>
                      <option>Aids & appliances</option>

                    </select>
                  </div>
                </div>
              </div>




              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label htmlFor="cover-photo" className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
                  Upload Receipt
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <div className="flex max-w-2xl justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                    <div className="text-center">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                      <div className="mt-4 flex text-sm leading-6 text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                        >
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                        </label>

                      </div>
                      <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF are supported up to 10MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-6 flex items-center justify-end gap-x-6">
          <button type="button" className="text-sm font-semibold leading-6 text-gray-900">
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Upload
          </button>
        </div>
      </form>


      <h2 className="text-base font-semibold leading-7 text-gray-900">Manage Receipts</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
        View and manage existing receipts.
      </p>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Provider
                    </th>

                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Category
                    </th>

                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>

                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>

                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">View</span>
                    </th>

                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Delete</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {receipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {receipt.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{receipt.category}</td>

                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{receipt.status}</td>

                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{receipt.date}</td>

                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 cursor-pointer">
                        <a onClick={() => handleView()} className="text-indigo-600 hover:text-indigo-900">
                          View
                        </a>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <a className="text-indigo-600 hover:text-indigo-900">
                          Delete
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>

  )
}