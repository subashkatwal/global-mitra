import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  Shield, CheckCircle, XCircle, MessageCircle, MapPin,
  Clock, TrendingUp, Award, Search,
  AlertTriangle, Camera, Lightbulb, Sparkles
} from 'lucide-react';
import { useReportStore } from '@/store/reportStore';
import { useAuthStore } from '@/store/authStore';
import type { Report, ReportType } from '@/types';

const reportTypeIcons: Record<ReportType, any> = {
  photo_update: Camera,
  status_alert: AlertTriangle,
  tip_share: Lightbulb,
  emergency_warning: AlertTriangle,
  new_discovery: Sparkles,
};

const reportTypeColors: Record<ReportType, string> = {
  photo_update: '#FF6B35',
  status_alert: '#F7B801',
  tip_share: '#2ECC71',
  emergency_warning: '#E74C3C',
  new_discovery: '#004E89',
};

export function GuideDashboard() {
  const [filter, setFilter] = useState<'all' | 'nearby' | 'urgent'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true });
  
  const { pendingReports, approveReport, denyReport } = useReportStore();
  const { user } = useAuthStore();

  const filteredReports = pendingReports.filter((report) => {
    if (filter === 'nearby') return true; // Simplified
    if (filter === 'urgent') return report.type === 'emergency_warning';
    return true;
  });

  const handleApprove = (reportId: string) => {
    if (user) {
      approveReport(reportId, user.id);
      setSelectedReport(null);
    }
  };

  const handleDeny = (reportId: string) => {
    denyReport(reportId, 'Report does not meet verification criteria');
    setSelectedReport(null);
  };

  return (
    <div ref={sectionRef} className="min-h-screen bg-[#FDF8F3]">
      <div className="section-padding py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-[#2ECC71] flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#2C3E50]">
                    Guide Dashboard
                  </h1>
                  <p className="text-[#7F8C8D]">Verify reports and help the community</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4">
              <div className="px-4 py-3 bg-white rounded-xl shadow-sm">
                <p className="text-2xl font-bold text-[#2C3E50]">{pendingReports.length}</p>
                <p className="text-xs text-[#7F8C8D]">Pending</p>
              </div>
              <div className="px-4 py-3 bg-white rounded-xl shadow-sm">
                <p className="text-2xl font-bold text-[#2ECC71]">156</p>
                <p className="text-xs text-[#7F8C8D]">Verified</p>
              </div>
              <div className="px-4 py-3 bg-white rounded-xl shadow-sm">
                <p className="text-2xl font-bold text-[#F7B801]">98%</p>
                <p className="text-xs text-[#7F8C8D]">Accuracy</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center gap-4 mb-6"
          >
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'All Reports' },
                { id: 'nearby', label: 'Near Me' },
                { id: 'urgent', label: 'Urgent' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as any)}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    filter === f.id
                      ? 'bg-[#2C3E50] text-white'
                      : 'bg-white text-[#7F8C8D] hover:bg-gray-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-[#2ECC71] focus:outline-none text-sm"
              />
            </div>
          </motion.div>

          {/* Reports List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {filteredReports.length > 0 ? (
              filteredReports.map((report, index) => {
                const Icon = reportTypeIcons[report.type];
                const color = reportTypeColors[report.type];
                
                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Type Icon */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="w-6 h-6" style={{ color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-[#2C3E50]">{report.title}</h4>
                          {report.type === 'emergency_warning' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#7F8C8D] line-clamp-2 mb-2">
                          {report.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-[#7F8C8D]">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            2.3km from you
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(report.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            by {report.user.name}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="px-4 py-2 rounded-xl bg-gray-100 text-[#2C3E50] text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleApprove(report.id)}
                          className="px-4 py-2 rounded-xl bg-[#2ECC71] text-white text-sm font-medium hover:bg-[#27ae60] transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleDeny(report.id)}
                          className="px-4 py-2 rounded-xl bg-red-100 text-red-600 text-sm font-medium hover:bg-red-200 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl">
                <CheckCircle className="w-16 h-16 text-[#2ECC71] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#2C3E50] mb-2">All Caught Up!</h3>
                <p className="text-[#7F8C8D]">No pending reports to verify at the moment.</p>
              </div>
            )}
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <h3 className="font-semibold text-[#2C3E50] mb-4">Your Achievements</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Top Verifier', desc: '100+ verifications', icon: Award, color: '#F7B801' },
                { name: 'Speed Demon', desc: '< 1hr avg. response', icon: Clock, color: '#FF6B35' },
                { name: 'Accuracy Pro', desc: '98% approval rate', icon: TrendingUp, color: '#2ECC71' },
                { name: 'Helper', desc: '50+ helpful comments', icon: MessageCircle, color: '#004E89' },
              ].map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <div
                    key={achievement.name}
                    className="p-4 bg-white rounded-xl shadow-sm flex items-center gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${achievement.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: achievement.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-[#2C3E50] text-sm">{achievement.name}</p>
                      <p className="text-xs text-[#7F8C8D]">{achievement.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-auto"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${reportTypeColors[selectedReport.type]}20` }}
                >
                  {(() => {
                    const Icon = reportTypeIcons[selectedReport.type];
                    return <Icon className="w-6 h-6" style={{ color: reportTypeColors[selectedReport.type] }} />;
                  })()}
                </div>
                <div>
                  <h3 className="font-semibold text-[#2C3E50]">{selectedReport.title}</h3>
                  <p className="text-sm text-[#7F8C8D]">{selectedReport.type.replace('_', ' ')}</p>
                </div>
              </div>

              <p className="text-[#2C3E50] mb-4">{selectedReport.description}</p>

              {selectedReport.images.length > 0 && (
                <div className="mb-4">
                  <img
                    src={selectedReport.images[0]}
                    alt="Report"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 mb-6">
                <img
                  src={selectedReport.user.avatar}
                  alt={selectedReport.user.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-[#7F8C8D]">Submitted by {selectedReport.user.name}</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(selectedReport.id)}
                  className="flex-1 py-3 rounded-xl bg-[#2ECC71] text-white font-semibold hover:bg-[#27ae60] transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve (+10 pts)
                </button>
                <button
                  onClick={() => handleDeny(selectedReport.id)}
                  className="flex-1 py-3 rounded-xl bg-red-100 text-red-600 font-semibold hover:bg-red-200 transition-colors"
                >
                  Deny
                </button>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="w-full mt-3 py-3 text-[#7F8C8D] hover:text-[#2C3E50] transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
