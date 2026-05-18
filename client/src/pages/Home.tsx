import { useState } from "react";

interface Job {
  id: number;
  carMakeModel: string;
  jobType: string;
  jobDescription: string;
  salesman: string;
  technician: string;
  status: string;
}

const statuses = ["Waiting", "In Progress", "Done"];
const salesmen = ["Mazin", "Frank", "Oscar", "Nasser", "Luis", "Adam"];
const technicians = [
  "Habibi",
  "Maro",
  "Luis Jr",
  "Ivan",
  "Eric",
  "Dale",
  "Gary",
  "Angel",
  "Jimmy",
  "Big Junior",
  "Manuel",
];

let nextId = 1;

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);

  function addJob() {
    setJobs([
      ...jobs,
      {
        id: nextId++,
        carMakeModel: "",
        jobType: "",
        jobDescription: "",
        salesman: "",
        technician: "",
        status: "",
      },
    ]);
  }

  function updateJob(id: number, field: keyof Job, value: string) {
    setJobs(jobs.map((j) => (j.id === id ? { ...j, [field]: value } : j)));
  }

  function removeJob(id: number) {
    setJobs(jobs.filter((j) => j.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-200 p-4">
      {/* Header */}
      <div className="bg-red-700 text-white text-center py-4 rounded-t-lg max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-wide">BNC WORK ORDERS</h1>
      </div>

      {/* Main area */}
      <div className="max-w-3xl mx-auto bg-gray-100 p-4 rounded-b-lg shadow-lg">
        {/* Add Job button */}
        <button
          onClick={addJob}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-3 rounded mb-4 active:scale-[0.97] transition-transform"
        >
          + Add New Job
        </button>

        {/* Job cards */}
        {jobs.length === 0 && (
          <p className="text-center text-gray-500 text-lg py-8">
            No jobs yet. Click "Add New Job" to start.
          </p>
        )}

        {jobs.map((job, index) => (
          <div
            key={job.id}
            className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-4 shadow"
          >
            {/* Job number + remove */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-bold text-gray-700">
                Job #{index + 1}
              </span>
              <button
                onClick={() => removeJob(job.id)}
                className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-3 py-1 rounded"
              >
                Remove
              </button>
            </div>

            {/* 3 write-in fields */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  1. Car Make / Model
                </label>
                <input
                  type="text"
                  placeholder="e.g. Toyota Camry"
                  value={job.carMakeModel}
                  onChange={(e) =>
                    updateJob(job.id, "carMakeModel", e.target.value)
                  }
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 text-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  2. Job Type
                </label>
                <input
                  type="text"
                  placeholder="e.g. Window Tint"
                  value={job.jobType}
                  onChange={(e) =>
                    updateJob(job.id, "jobType", e.target.value)
                  }
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 text-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  3. Job Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full car tint 20%"
                  value={job.jobDescription}
                  onChange={(e) =>
                    updateJob(job.id, "jobDescription", e.target.value)
                  }
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 text-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Status */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Status
              </label>
              <select
                value={job.status}
                onChange={(e) =>
                  updateJob(job.id, "status", e.target.value)
                }
                className="w-full border-2 border-gray-300 rounded px-3 py-2 text-lg bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Pick --</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Salesman (bottom left) and Technician (bottom right) */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Salesman
                </label>
                <select
                  value={job.salesman}
                  onChange={(e) =>
                    updateJob(job.id, "salesman", e.target.value)
                  }
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 text-lg bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Pick --</option>
                  {salesmen.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Technician
                </label>
                <select
                  value={job.technician}
                  onChange={(e) =>
                    updateJob(job.id, "technician", e.target.value)
                  }
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 text-lg bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Pick --</option>
                  {technicians.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
