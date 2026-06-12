import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Search, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock,
  IndianRupee,
  Activity,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface PlanHistory {
  id: number;
  userId: string;
  userName: string;
  email: string;
  planName: string;
  planPrice: number;
  paymentStatus: string;
  paymentMethod: string;
  transactionId: string;
  purchaseDate: string;
  expiryDate: string;
  planStatus: string;
}

interface PlanHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export function PlanHistoryModal({ isOpen, onClose, userId, userName }: PlanHistoryModalProps) {
  const [history, setHistory] = useState<PlanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (isOpen && userId) {
      fetchPlanHistory();
    }
  }, [isOpen, userId]);

  const fetchPlanHistory = async () => {
    setLoading(true);
    try {
      // Assuming the Spring Boot backend is running on localhost:8080
      // In a real scenario, you'd use your environment's API URL
      const response = await fetch(`http://localhost:8080/api/admin/plan-history/${userId}`);
      
      if (!response.ok) {
        // Fallback to mock data if backend isn't available for preview purposes
        generateMockData();
        return;
      }
      
      const data = await response.json();
      setHistory(data);
      
      // Fetch total revenue
      const revenueResponse = await fetch(`http://localhost:8080/api/admin/plan-history/${userId}/revenue`);
      if (revenueResponse.ok) {
        const revenueData = await revenueResponse.json();
        setTotalRevenue(revenueData.totalRevenue || 0);
      }
    } catch (error) {
      console.error("Failed to fetch plan history:", error);
      toast.error("Failed to connect to backend API. Using mock data for preview.");
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const mockData: PlanHistory[] = [
      {
        id: 1,
        userId: userId,
        userName: userName,
        email: "user@example.com",
        planName: "Pro",
        planPrice: 99.0,
        paymentStatus: "Success",
        paymentMethod: "Card",
        transactionId: "TXN-84729103",
        purchaseDate: new Date().toISOString(),
        expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        planStatus: "Active"
      },
      {
        id: 2,
        userId: userId,
        userName: userName,
        email: "user@example.com",
        planName: "Basic",
        planPrice: 29.0,
        paymentStatus: "Success",
        paymentMethod: "UPI",
        transactionId: "TXN-74829182",
        purchaseDate: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(),
        expiryDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
        planStatus: "Expired"
      }
    ];
    setHistory(mockData);
    setTotalRevenue(128.0);
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'expired': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'success': return 'text-emerald-400';
      case 'failed': return 'text-red-400';
      case 'pending': return 'text-amber-400';
      default: return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  // Filter Data
  const filteredHistory = history.filter(item => {
    const matchesSearch = item.planName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = planFilter === "All" || item.planName === planFilter;
    const matchesStatus = statusFilter === "All" || item.planStatus === statusFilter;
    
    return matchesSearch && matchesPlan && matchesStatus;
  }).sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl max-h-[90vh] glass rounded-[2rem] border-white/10 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between sticky top-0 z-10">
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-primary" /> 
                Plan History
              </h2>
              <p className="text-white/40 text-xs mt-1 uppercase tracking-widest font-bold">
                {userName} <span className="text-white/20">|</span> <span className="font-mono">{userId}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Total Revenue</p>
                <p className="text-xl font-black text-emerald-400 flex items-center justify-end gap-1">
                  $<span className="italic">{totalRevenue.toFixed(2)}</span>
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 text-white/60">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            
            {/* Filters Section */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end bg-white/[0.01] p-4 rounded-2xl border border-white/5">
              <div className="flex flex-wrap gap-4 flex-1">
                <div className="space-y-1.5 w-full max-w-xs">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Search Records</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <Input 
                      placeholder="Search plan or TXN..." 
                      className="pl-10 bg-white/5 border-white/10 rounded-xl text-sm h-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Plan Type</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl text-sm h-10 px-4 text-white outline-none appearance-none"
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                  >
                    <option value="All" className="bg-[#0f0f0f]">All Plans</option>
                    <option value="Free" className="bg-[#0f0f0f]">Free</option>
                    <option value="Basic" className="bg-[#0f0f0f]">Basic</option>
                    <option value="Pro" className="bg-[#0f0f0f]">Pro</option>
                    <option value="Enterprise" className="bg-[#0f0f0f]">Enterprise</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Status</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl text-sm h-10 px-4 text-white outline-none appearance-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All" className="bg-[#0f0f0f]">All Statuses</option>
                    <option value="Active" className="bg-[#0f0f0f]">Active</option>
                    <option value="Expired" className="bg-[#0f0f0f]">Expired</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-white/40">
                  <Activity className="h-8 w-8 mb-4 animate-spin text-primary" />
                  <p className="text-sm font-medium">Fetching secure records...</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-white/20">
                  <Filter className="h-10 w-10 mb-4 opacity-50" />
                  <p className="text-sm italic">No records match your criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="pl-6 text-white/40 uppercase text-[10px] font-black tracking-widest">Plan</TableHead>
                        <TableHead className="text-white/40 uppercase text-[10px] font-black tracking-widest">Amount</TableHead>
                        <TableHead className="text-white/40 uppercase text-[10px] font-black tracking-widest">Payment</TableHead>
                        <TableHead className="text-white/40 uppercase text-[10px] font-black tracking-widest">Transaction ID</TableHead>
                        <TableHead className="text-white/40 uppercase text-[10px] font-black tracking-widest">Timeline</TableHead>
                        <TableHead className="pr-6 text-right text-white/40 uppercase text-[10px] font-black tracking-widest">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((item) => (
                        <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                          <TableCell className="pl-6 py-4">
                            <span className="font-bold text-sm bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                              {item.planName}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm font-bold flex items-center gap-1">
                              <span className="text-white/40">$</span>{item.planPrice.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className={`text-xs font-bold flex items-center gap-1 ${getStatusColor(item.paymentStatus)}`}>
                                {item.paymentStatus === 'Success' ? <CheckCircle2 className="h-3 w-3" /> : 
                                 item.paymentStatus === 'Failed' ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                {item.paymentStatus}
                              </span>
                              <span className="text-[10px] text-white/40 font-mono mt-1 uppercase">{item.paymentMethod}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-[11px] text-white/60 bg-black/50 px-2 py-1 rounded">
                              {item.transactionId || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-white/60 flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-white/30" />
                                {new Date(item.purchaseDate).toLocaleDateString()}
                              </span>
                              <span className="text-[10px] text-white/40 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-white/30" />
                                Expires: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border inline-flex ${getStatusColor(item.planStatus)}`}>
                              {item.planStatus}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
