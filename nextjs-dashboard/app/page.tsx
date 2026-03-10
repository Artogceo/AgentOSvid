import { Card, CardContent } from './components/ui/Card'
import { LineChartComponent, BarChartComponent, PieChartComponent } from './components/ui/Chart'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

// Sample data for charts
const lineData = [
  { name: 'Jan', value: 400, value2: 240 },
  { name: 'Feb', value: 300, value2: 139 },
  { name: 'Mar', value: 200, value2: 980 },
  { name: 'Apr', value: 278, value2: 390 },
  { name: 'May', value: 189, value2: 480 },
  { name: 'Jun', value: 239, value2: 380 },
  { name: 'Jul', value: 349, value2: 430 },
]

const barData = [
  { name: 'Product A', value: 4000 },
  { name: 'Product B', value: 3000 },
  { name: 'Product C', value: 2000 },
  { name: 'Product D', value: 2780 },
  { name: 'Product E', value: 1890 },
]

const pieData = [
  { name: 'Desktop', value: 400 },
  { name: 'Mobile', value: 300 },
  { name: 'Tablet', value: 300 },
  { name: 'Other', value: 200 },
]

// Stat card component
function StatCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon 
}: { 
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative'
  icon: any
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {changeType === 'positive' ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>{change}</span>
            </div>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Download Report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value="$45,231"
            change="+20.1%"
            changeType="positive"
            icon={DollarSign}
          />
          <StatCard
            title="Active Users"
            value="2,345"
            change="+15.2%"
            changeType="positive"
            icon={Users}
          />
          <StatCard
            title="Conversion Rate"
            value="3.24%"
            change="-4.1%"
            changeType="negative"
            icon={TrendingUp}
          />
          <StatCard
            title="Active Sessions"
            value="12,234"
            change="+8.4%"
            changeType="positive"
            icon={Activity}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <Card title="Revenue Overview" icon={<TrendingUp className="w-5 h-5" />}>
            <LineChartComponent data={lineData} dataKeys={['value', 'value2']} />
          </Card>

          {/* Bar Chart */}
          <Card title="Sales by Product" icon={<DollarSign className="w-5 h-5" />}>
            <BarChartComponent data={barData} />
          </Card>

          {/* Pie Chart */}
          <Card title="Traffic Sources" icon={<Users className="w-5 h-5" />}>
            <PieChartComponent data={pieData} />
          </Card>

          {/* Recent Activity */}
          <Card title="Recent Activity" icon={<Activity className="w-5 h-5" />}>
            <div className="space-y-4">
              {[
                { action: 'New user registered', time: '2 minutes ago', type: 'user' },
                { action: 'Order #1234 completed', time: '15 minutes ago', type: 'order' },
                { action: 'Payment received', time: '1 hour ago', type: 'payment' },
                { action: 'New comment on post', time: '2 hours ago', type: 'comment' },
                { action: 'Server backup completed', time: '3 hours ago', type: 'system' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      item.type === 'user' ? 'bg-blue-500' :
                      item.type === 'order' ? 'bg-green-500' :
                      item.type === 'payment' ? 'bg-yellow-500' :
                      item.type === 'comment' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="text-sm text-gray-700">{item.action}</span>
                  </div>
                  <span className="text-xs text-gray-500">{item.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
