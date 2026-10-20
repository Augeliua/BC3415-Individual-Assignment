
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, ScanSearch, ClipboardList,
  Info, AlertCircle, RefreshCw, ChevronDown,
  TrendingUp, Flag, ShieldAlert, MessageSquareText,
  Search, X, ArrowUpDown, ChevronLeft, ChevronRight
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend
} from 'recharts'

const COLORS = {
  Positive: '#4C9B83',
  Neutral: '#A3ADBB',
  Negative: '#D77F7F'
}

const CATEGORIES = [
  'Product Defect',
  'Material / Quality',
  'Sizing / Fit',
  'Misdelivery'
]

const KPI_INFO = [
  {
    key: 'Reviews Analysed',
    label: 'Reviews Analysed',
    icon: MessageSquareText,
    help: 'Number of reviews analysed in the selected development sample.'
  },
  {
    key: 'Reviews Flagged',
    label: 'Reviews Flagged',
    icon: Flag,
    help: 'Reviews with at least one AI-detected complaint. Each review is counted once, even when multiple complaints are detected.'
  },
  {
    key: 'High-Priority Cases',
    label: 'High-Priority Cases',
    icon: ShieldAlert,
    help: 'Subset of flagged reviews requiring earlier investigation. Product Defect and Misdelivery complaints receive High priority; Material / Quality and Sizing / Fit receive Medium priority unless a High-priority issue is also detected. These are preliminary rules, not verified severity.'
  },
  {
    key: 'Positive Sentiment %',
    label: 'Positive Sentiment',
    icon: TrendingUp,
    help: 'Percentage of reviews classified as Positive by DistilBERT. A positive review may still contain a complaint.'
  }
]

function InfoTip({ text }) {
  return (
    <span className="relative group inline-flex align-middle">
      <button
        type="button"
        aria-label="More information"
        className="text-slate-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full"
      >
        <Info size={15} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 mb-2
        w-64 max-w-[75vw] rounded-xl bg-slate-900 p-3 text-xs
        leading-relaxed text-white shadow-xl opacity-0 invisible
        group-hover:opacity-100 group-hover:visible
        group-focus-within:opacity-100 group-focus-within:visible
        transition-opacity z-50 font-normal"
      >
        {text}
      </span>
    </span>
  )
}

function Card({ children, className = '' }) {
  return (
    <section className={`bg-white border border-slate-200
      rounded-2xl shadow-sm ${className}`}>
      {children}
    </section>
  )
}

function KpiCard({ config, value, onExplore }) {
  const Icon = config.icon
  const formatted = config.key === 'Positive Sentiment %'
    ? `${Number(value ?? 0).toFixed(1)}%`
    : Number(value ?? 0).toLocaleString()

  return (
    <Card className="p-5 min-w-0 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all">
      <div role="button" tabIndex={0}
        aria-label={`View reviews for ${config.label}`}
        onClick={() => onExplore({
          title: config.label,
          params: config.key === 'Reviews Flagged'
            ? { flagged: 'true' }
            : config.key === 'High-Priority Cases'
              ? { priority: 'High' }
              : config.key === 'Positive Sentiment %'
                ? { sentiment: 'Positive' }
                : {}
        })}
        onKeyDown={e => {
          if (e.target === e.currentTarget &&
              (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            e.currentTarget.click()
          }
        }}>
    
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-500">
            {config.label}
          </span>
          <InfoTip text={config.help} />
        </div>
        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">
        {formatted}
      </div>
      </div>
    </Card>
  )
}

function SentimentOverview({ sentiment, onExplore }) {
  const data = ['Positive', 'Neutral', 'Negative'].map(name => ({
    name,
    value: Number(sentiment?.[name] ?? 0)
  }))
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="p-6 min-w-0">
      <div className="flex gap-2 items-center">
        <h3 className="text-lg font-semibold">Sentiment Overview</h3>
        <InfoTip text="Distribution of DistilBERT sentiment predictions across the selected reviews. Sentiment does not indicate whether a complaint was detected." />
      </div>
      <p className="text-sm text-slate-500 mt-1">
        Overall customer sentiment
      </p>

      <div className="relative h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              onClick={entry => onExplore({
                title: `${entry.name} Sentiment`,
                params: { sentiment: entry.name }
              })}
              cursor="pointer"
              dataKey="value"
              nameKey="name"
              innerRadius="67%"
              outerRadius="88%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map(item => (
                <Cell key={item.name} fill={COLORS[item.name]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [
              `${value} reviews`, name
            ]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center
          justify-center pointer-events-none">
          <span className="text-3xl font-semibold text-slate-900">
            {total}
          </span>
          <span className="text-xs text-slate-500">Reviews</span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        {data.map(item => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full"
              style={{ background: COLORS[item.name] }} />
            <span className="text-slate-600">{item.name}</span>
            <span className="font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function IssueChart({ breakdown, onExplore }) {
  const [scope, setScope] = useState('Complaints')
  const [mode, setMode] = useState('Counts')

  const data = CATEGORIES.map(category => {
    const rows = breakdown.filter(
      row => row.Category === category && row.Scope === scope
    )

    const counts = Object.fromEntries(
      ['Positive', 'Neutral', 'Negative'].map(name => [
        name,
        rows.find(row => row.Sentiment === name)?.Reviews ?? 0
      ])
    )

    const total = Object.values(counts).reduce(
      (sum, value) => sum + Number(value), 0
    )

    const result = { category, total, counts }
    for (const name of Object.keys(COLORS)) {
      result[name] = mode === 'Percentages'
        ? total ? (100 * counts[name] / total) : 0
        : Number(counts[name])
    }
    return result
  })

  return (
    <Card className="p-6 min-w-0">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Sentiment by Issue</h3>
        <InfoTip text="Compare sentiment across detected issue categories. Complaints includes only complaints; All Mentions includes observations and complaints. Reviews can appear in multiple categories." />
      </div>
      <p className="text-sm text-slate-500 mt-1">
        Explore how sentiment differs across reported issues
      </p>

      <div className="flex flex-wrap gap-2 mt-5">
        <select
          aria-label="Issue context filter"
          value={scope}
          onChange={e => setScope(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option>Complaints</option>
          <option>All Mentions</option>
        </select>

        <select
          aria-label="Chart display"
          value={mode}
          onChange={e => setMode(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option>Counts</option>
          <option>Percentages</option>
        </select>
      </div>

      <div className="h-72 mt-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 12, bottom: 5, left: 5 }}
          >
            <CartesianGrid horizontal={false} stroke="#EEF1F5" />
            <XAxis
              type="number"
              domain={mode === 'Percentages' ? [0, 100] : [0, 'auto']}
              tickFormatter={v => mode === 'Percentages' ? `${v}%` : v}
              tick={{ fontSize: 11 }}
              allowDecimals={mode === 'Percentages'}
            />
            <YAxis
              type="category"
              dataKey="category"
              width={108}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(value, name, props) => {
                const count = props.payload.counts[name]
                return [
                  mode === 'Percentages'
                    ? `${Number(value).toFixed(1)}% (${count} reviews)`
                    : `${count} reviews`,
                  name
                ]
              }}
            />
            <Legend />
            {Object.entries(COLORS).map(([name, color]) => (
              <Bar
                key={name}
                dataKey={name}
                stackId="sentiment"
                fill={color}
                cursor="pointer"
                onClick={entry => {
                  const category = entry?.payload?.category
                  if (category) onExplore({
                    title: `${name} · ${category} · ${scope}`,
                    params: { sentiment: name, category, scope }
                  })
                }}
                radius={[0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 space-y-1">
        {data.map(row => (
          <p key={row.category} className="text-xs text-slate-500">
            {row.category}: {row.total} reviews
          </p>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-3">
        Category totals can overlap because a review may mention multiple issues.
      </p>
    </Card>
  )
}


function ReviewExplorer({ selection, filters, onClose }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('id')
  const [ascending, setAscending] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedReview, setSelectedReview] = useState(null)
  const pageSize = 10

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setReviews([])
    setSelectedReview(null)
    setSearch('')
    setPage(1)

    const commonFilters = {
      clothing_category: filters.category,
      dashboard_priority: filters.priority,
      dashboard_sentiment: filters.sentiment
    }

    const params = new URLSearchParams(
      Object.entries({
        ...commonFilters,
        ...selection.params
      }).filter(([, value]) => value !== '' && value != null)
    )

    fetch(
      selection.ids
        ? `/api/dashboard/reviews/by-ids?${new URLSearchParams({
            ...Object.fromEntries(
              Object.entries({
                clothing_category: filters.category,
                dashboard_priority: filters.priority,
                dashboard_sentiment: filters.sentiment
              }).filter(([, value]) => value)
            ),
            ids: selection.ids.join(',')
          })}`
        : `/api/dashboard/reviews?${params}`,
      {
      signal: controller.signal
    })
      .then(response => {
        if (!response.ok) throw new Error(`API error ${response.status}`)
        return response.json()
      })
      .then(data => setReviews(data.reviews ?? []))
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [filters, selection])

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') {
        if (selectedReview) setSelectedReview(null)
        else onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [selectedReview, onClose])

  const filtered = reviews
    .filter(review => {
      const query = search.toLowerCase().trim()
      return !query || [
        review.id,
        review.review,
        review.sentiment,
        review.priority,
        ...(review.complaint_categories ?? [])
      ].join(' ').toLowerCase().includes(query)
    })
    .sort((a, b) => {
      let left = a[sort] ?? ''
      let right = b[sort] ?? ''
      if (sort === 'id') {
        left = Number(left)
        right = Number(right)
      }
      const comparison = typeof left === 'number'
        ? left - right
        : String(left).localeCompare(String(right))
      return ascending ? comparison : -comparison
    })

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  function changeSort(column) {
    if (sort === column) setAscending(!ascending)
    else {
      setSort(column)
      setAscending(true)
    }
    setPage(1)
  }

  const contextLabels = {
    0: 'Not mentioned',
    1: 'Observation',
    2: 'Complaint',
    3: 'Uncertain'
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/40 p-3 sm:p-6
      flex items-center justify-center">
      <div role="dialog" aria-modal="true" aria-label="Review Explorer"
        className="bg-[#F8FAFC] w-full max-w-7xl h-[92vh]
        rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        <header className="flex items-start justify-between gap-4
          border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase">
              RetailSense · Review Explorer
            </p>
            <h2 className="text-xl font-semibold mt-1">{selection.title}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {loading ? 'Loading reviews...' :
                `${reviews.length} matching reviews · current filters`}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close Review Explorer"
            className="p-2 rounded-lg hover:bg-slate-100">
            <X size={22}/>
          </button>
        </header>

        <div className="px-6 pt-5 pb-3">
          <div className="relative max-w-md">
            <Search size={17} className="absolute left-3 top-3 text-slate-400"/>
            <input
              aria-label="Search reviews"
              placeholder="Search review text, category or priority..."
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full bg-white border border-slate-200 rounded-xl
                py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2
                focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-4">
          {loading && <p className="text-slate-500 py-8">Loading reviews...</p>}
          {error && <p className="text-red-600 py-8">{error}</p>}

          {!loading && !error && (
            <div className="border border-slate-200 rounded-xl bg-white
              overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 sticky top-0">
                  <tr>
                    {[
                      ['id', 'ID'],
                      ['review', 'Customer Review'],
                      ['sentiment', 'Sentiment'],
                      ['priority', 'Priority']
                    ].map(([key, label]) => (
                      <th key={key} className="px-4 py-3 font-medium">
                        <button onClick={() => changeSort(key)}
                          className="inline-flex gap-1 items-center">
                          {label}<ArrowUpDown size={12}/>
                        </button>
                      </th>
                    ))}
                    <th className="px-4 py-3 font-medium">Detected Complaints</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map(review => (
                    <tr key={review.id}
                      className="hover:bg-blue-50/40">
                      <td className="px-4 py-4 font-mono text-xs">
                        {review.id}
                      </td>
                      <td className="px-4 py-4 max-w-sm">
                        <p className="line-clamp-2">{review.review}</p>
                      </td>
                      <td className="px-4 py-4">{review.sentiment}</td>
                      <td className="px-4 py-4">{review.priority}</td>
                      <td className="px-4 py-4">
                        {(review.complaint_categories ?? []).join(', ') || 'None'}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setSelectedReview(review)}
                          className="text-blue-700 font-medium hover:underline">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="p-8 text-slate-500 text-center">
                  No matching reviews found.
                </p>
              )}
            </div>
          )}
        </div>

        <footer className="bg-white border-t border-slate-200
          px-6 py-4 flex flex-wrap justify-between gap-3 items-center">
          <p className="text-xs text-slate-500">
            {filtered.length} results · Page {page} of {pages}
          </p>
          <div className="flex gap-2 items-center">
            <button disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="border rounded-lg p-2 disabled:opacity-30">
              <ChevronLeft size={17}/>
            </button>
            <button disabled={page === pages}
              onClick={() => setPage(p => p + 1)}
              className="border rounded-lg p-2 disabled:opacity-30">
              <ChevronRight size={17}/>
            </button>
          </div>
        </footer>

        {selectedReview && (
          <div className="absolute inset-0 z-10 bg-slate-950/40
            flex justify-end">
            <div className="w-full max-w-xl bg-white h-full overflow-auto
              shadow-xl p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">
                  Review #{selectedReview.id}
                </h3>
                <button onClick={() => setSelectedReview(null)}
                  aria-label="Close review details"><X/></button>
              </div>


              <div className="bg-slate-50 rounded-xl p-4 my-5
                text-sm leading-relaxed whitespace-pre-wrap">
                {selectedReview.review}
              </div>


              <div className="flex flex-wrap gap-2 mb-6 text-sm">
                <span
                  title="Overall sentiment predicted by DistilBERT. Positive sentiment does not necessarily mean there are no complaints."
                  className="px-3 py-1.5 bg-slate-100 rounded-lg cursor-help"
                  tabIndex={0}
                >
                  {selectedReview.sentiment} Sentiment ⓘ
                </span>
                <span
                  title={selectedReview.priority === 'High'
                    ? 'High: A Product Defect or Misdelivery complaint was detected.'
                    : selectedReview.priority === 'Medium'
                      ? 'Medium: A Material / Quality or Sizing / Fit complaint was detected, without a higher-priority issue.'
                      : 'None: No complaint was detected.'}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg cursor-help"
                  tabIndex={0}
                >
                  {!selectedReview.priority ||
 selectedReview.priority === 'None'
  ? 'No Priority'
  : `${selectedReview.priority} Priority`} ⓘ
                </span>
              </div>

              <h4 className="font-semibold mb-3">Reported Concerns</h4>
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedReview.complaint_categories.length > 0
                  ? selectedReview.complaint_categories.map(category => (
                      <span key={category}
                        className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm">
                        {category}
                      </span>
                    ))
                  : <p className="text-sm text-slate-500">
                      No complaints detected.
                    </p>}
              </div>

              <h4 className="font-semibold mb-2">
                Priority Explanation
              </h4>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                
{selectedReview.priority_reason}

              </p>


            </div>
          </div>
        )}
      </div>
    </div>
  )
}



function ProductIntelligence({ filters, onExplore }) {
  const [data, setData] = useState(null)
  const [level, setLevel] = useState('category')
  const [concernSearch, setConcernSearch] = useState('')
  const [concernSort, setConcernSort] = useState('count')
  const [showAllConcerns, setShowAllConcerns] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setData(null)
    setError('')
    setShowAllConcerns(false)

    fetch(`/api/dashboard/product-intelligence?${new URLSearchParams(
      Object.entries({
        clothing_category: filters.category,
        dashboard_priority: filters.priority,
        dashboard_sentiment: filters.sentiment
      }).filter(([, value]) => value)
    )}`, {
      signal: controller.signal
    })
      .then(response => {
        if (!response.ok) throw new Error(
          `Product Intelligence API returned ${response.status}`
        )
        return response.json()
      })
      .then(setData)
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [filters])

  const findings = level === 'category'
    ? (data?.category_insights ?? [])
    : (data?.product_insights ?? [])

  const matchingFindings = findings
    .filter(finding => {
      const query = concernSearch.toLowerCase().trim()
      return !query || [
        finding.group,
        finding.concern,
        finding.issue_category
      ].join(' ').toLowerCase().includes(query)
    })
    .sort((a, b) => {
      if (concernSort === 'proportion') {
        const aRate = a.group_reviews
          ? a.supporting_reviews / a.group_reviews : 0
        const bRate = b.group_reviews
          ? b.supporting_reviews / b.group_reviews : 0

        return bRate - aRate ||
          b.supporting_reviews - a.supporting_reviews
      }

      return b.supporting_reviews - a.supporting_reviews
    })

  const selected = showAllConcerns
    ? matchingFindings
    : matchingFindings.slice(0, 8)

  return (
    <section className="mt-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold">
              Recurring Customer Concerns
            </h3>
            <InfoTip text="Candidate patterns supported by at least two reviews with both a predicted complaint and matching review text. These do not establish verified product defects." />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Automatically consolidated customer feedback
          </p>
        </div>

        <div className="flex gap-1 p-1 bg-white border border-slate-200
          rounded-xl">
          {[
            ['category', 'Clothing Categories'],
            ['product', 'Individual Products']
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setLevel(value)}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm ${
                level === value
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="search"
          aria-label="Search recurring concerns"
          value={concernSearch}
          onChange={e => {
            setConcernSearch(e.target.value)
            setShowAllConcerns(false)
          }}
          placeholder="Search category, product ID or concern..."
          className="bg-white border border-slate-200 rounded-xl
            px-4 py-2.5 text-sm flex-1 min-w-52 outline-none
            focus:ring-2 focus:ring-blue-200"
        />
        <select
          aria-label="Sort recurring concerns"
          value={concernSort}
          onChange={e => setConcernSort(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl
            px-3 py-2.5 text-sm"
        >
          <option value="count">Most reported</option>
          <option value="proportion">Highest proportion</option>
        </select>
      </div>

      {loading && (
        <Card className="p-6 text-slate-500">
          Loading recurring customer concerns...
        </Card>
      )}

      {error && (
        <Card className="p-6 text-red-700">
          Unable to load product insights: {error}
        </Card>
      )}

      {!loading && !error && findings.length === 0 && (
        <Card className="p-7">
          <h4 className="font-semibold">
            No recurring concerns identified
          </h4>
          <p className="text-sm text-slate-500 mt-2">
            No {level === 'product'
              ? 'individual product'
              : 'clothing category'} met the minimum
            supporting-review threshold in this sample.
            This does not mean there are no customer concerns.
          </p>
        </Card>
      )}

      {!loading && !error && findings.length > 0 && (
        <>
          <p className="text-xs text-slate-500">
            Showing {selected.length} of {matchingFindings.length}
            {' '}matching patterns
          </p>

          {matchingFindings.length === 0 && (
            <Card className="p-6 text-sm text-slate-500">
              No concerns match your search.
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {selected.map((finding, index) => (
              <Card key={`${level}-${finding.group}-${finding.concern}-${index}`}
                className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-blue-700">
                      {level === 'product'
                        ? `Product #${finding.group}`
                        : finding.group}
                    </p>
                    <h4 className="font-semibold mt-1">
                      {finding.concern}
                    </h4>
                  </div>
                  <div className="bg-blue-50 text-blue-700
                    rounded-lg px-3 py-2 text-sm font-semibold shrink-0">
                    {finding.supporting_reviews}
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  {finding.supporting_reviews} supporting reviews
                  {' '}out of {finding.group_reviews} analysed
                  in this group
                </p>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase
                    tracking-wide">
                    Potential improvement
                  </p>
                  <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                    {finding.recommendation}
                  </p>
                </div>

                <button
                  onClick={() => onExplore({
                    title: `${finding.group} · ${finding.concern}`,
                    ids: finding.review_ids,
                    params: {}
                  })}
                  className="mt-auto pt-2 text-blue-700 text-sm
                    font-semibold hover:underline self-start"
                >
                  View {finding.supporting_reviews} supporting reviews →
                </button>
              </Card>
            ))}
          </div>

          {matchingFindings.length > 8 && (
            <button
              onClick={() => setShowAllConcerns(value => !value)}
              className="mx-auto block rounded-xl border
                border-slate-200 bg-white px-5 py-2.5
                text-sm font-semibold text-blue-700
                hover:bg-blue-50"
            >
              {showAllConcerns
                ? 'Show Less'
                : `Show More (${matchingFindings.length - 8} remaining)`}
            </button>
          )}

          <p className="text-xs text-slate-500">
            {data.note} Patterns across clothing categories may involve
            different product designs.
          </p>
        </>
      )}
    </section>
  )
}

const navigation = [
  { name: 'Retail Intelligence', icon: LayoutDashboard },
  { name: 'AI Review Inspector', icon: ScanSearch },
  { name: 'Investigation Workspace', icon: ClipboardList }
]

export default function App() {
  const [selection, setSelection] = useState(null)
  const [filters, setFilters] = useState({
    category: '',
    priority: '',
    sentiment: ''
  })
  const [filterOptions, setFilterOptions] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    fetch('/api/dashboard/filters')
      .then(response => {
        if (!response.ok) throw new Error('Unable to load filters')
        return response.json()
      })
      .then(setFilterOptions)
      .catch(console.error)
  }, [])

  const filterQuery = new URLSearchParams(
    Object.entries({
      category: filters.category,
      priority: filters.priority,
      sentiment: filters.sentiment
    }).filter(([, value]) => value)
  ).toString()

  useEffect(() => {
    const controller = new AbortController()

    fetch(`/api/dashboard?${filterQuery}`, {
      signal: controller.signal
    })
      .then(response => {
        if (!response.ok) throw new Error('Dashboard request failed')
        return response.json()
      })
      .then(data => {
        setDashboard(data)
        setError('')
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError('Unable to load dashboard data. Check the FastAPI server.')
          setDashboard(null)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [filterQuery, refresh])

  function changeFilter(key, value) {
    setDashboard(null)
    setLoading(true)
    setFilters(previous => ({ ...previous, [key]: value }))
    setSelection(null)
  }

  return (
    <div className="min-h-screen lg:flex bg-[#F6F8FB] text-slate-900">
      <aside className="bg-white border-b lg:border-b-0 lg:border-r
        border-slate-200 lg:w-64 lg:min-h-screen lg:shrink-0 p-6">
        <h1 className="text-2xl font-bold tracking-tight">RetailSense</h1>
        <p className="text-xs text-slate-500 mt-1">
          Customer Experience Intelligence
        </p>

        <nav className="mt-8 space-y-2">
          {navigation.map(({ name, icon: Icon }, index) => (
            <div
              key={name}
              className={`flex items-center gap-3 rounded-xl p-3 text-sm ${
                index === 0
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-400'
              }`}
              title={index ? 'Coming in a later section' : name}
              aria-current={index === 0 ? 'page' : undefined}
            >
              <Icon size={18} />
              {name}
              {index !== 0 && (
                <span className="ml-auto text-[10px]">Soon</span>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 px-5 py-8 lg:px-10 lg:py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row
            sm:justify-between sm:items-end gap-5 mb-8">
            <div>
              <p className="text-xs font-semibold tracking-widest text-blue-700">
                CUSTOMER EXPERIENCE OVERVIEW
              </p>
              <h2 className="text-3xl font-semibold mt-2">
                Retail Intelligence
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Monitor feedback. Identify concerns. Prioritise attention.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {[
                {
                  key: 'category',
                  label: 'Product category',
                  options: filterOptions?.categories ?? [],
                  all: 'All Categories'
                },
                {
                  key: 'priority',
                  label: 'Priority',
                  options: ['High', 'Medium', 'None'],
                  all: 'All Priorities'
                },
                {
                  key: 'sentiment',
                  label: 'Sentiment',
                  options: ['Positive', 'Neutral', 'Negative'],
                  all: 'All Sentiments'
                }
              ].map(config => (
                <select
                  key={config.key}
                  aria-label={config.label}
                  value={filters[config.key]}
                  onChange={e => changeFilter(config.key, e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl
                    py-2.5 px-3 text-sm shadow-sm max-w-48"
                >
                  <option value="">{config.all}</option>
                  {config.options.map(value => (
                    <option key={value} value={value}>
                      {value === 'None' ? 'No Priority' : value}
                    </option>
                  ))}
                </select>
              ))}
              <button
                aria-label="Refresh dashboard"
                title="Refresh dashboard"
                onClick={() => {
                  setLoading(true)
                  setRefresh(v => v + 1)
                }}
                className="p-2.5 bg-white rounded-xl border
                  border-slate-200 hover:bg-slate-50"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          {loading && (
            <Card className="p-8 text-slate-500">
              Loading customer feedback analytics...
            </Card>
          )}

          {error && !loading && (
            <Card className="p-6 text-red-700 flex items-center gap-3">
              <AlertCircle size={20} />
              {error}
            </Card>
          )}

          {dashboard && !loading && !error && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2
                xl:grid-cols-4 gap-4">
                {KPI_INFO.map(config => (
                  <KpiCard
                    key={config.key}
                    config={config}
                    value={dashboard.kpis?.[config.key]}
                    onExplore={setSelection}
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-6">
                <SentimentOverview sentiment={dashboard.sentiment} onExplore={setSelection} />
                <IssueChart breakdown={dashboard.issue_breakdown ?? []} onExplore={setSelection} />
              </div>

              <ProductIntelligence
                filters={filters}
                onExplore={setSelection}
              />

              <Card className="p-5 mt-6">
                <div className="flex items-start gap-3">
                  <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm">
                      About this analysis
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {dashboard.sample_note}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Showing {dashboard.sample_size} reviews.
                      Historical review sample; not a live retailer data feed.
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </main>
      {selection && (
        <ReviewExplorer
          selection={selection}
          filters={filters}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  )
}
