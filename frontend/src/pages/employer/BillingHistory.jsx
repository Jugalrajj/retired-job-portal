import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Download, FileText, Calendar, CheckCircle2, 
  ChevronLeft, ChevronRight, Search, Loader2 
} from "lucide-react";
import useAuthStore from "../../context/useAuthStore";
import toast from "react-hot-toast";

const BillingHistory = () => {
  const { user } = useAuthStore();
  const token = user?.token;

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // --- FETCH HISTORY ---
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/payment/history?page=${currentPage}&limit=8`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data.success) {
          setPayments(data.payments);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        toast.error("Failed to load billing history");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchHistory();
  }, [token, currentPage]);

  // --- HANDLE DOWNLOAD ---
  const handleDownload = async (paymentId) => {
    setDownloadingId(paymentId);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/payment/invoice/${paymentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob', // Important for files
        }
      );

      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success("Invoice downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download invoice");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="billing-history-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .billing-history-page {
          background-color: var(--bg-root);
          min-height: 100vh;
          padding: 40px 20px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: var(--text-main);
        }

        .container-xl {
          max-width: 1100px;
          margin: 0 auto;
        }

        /* --- HEADER --- */
        .page-header {
          display: flex; justify-content: space-between; align-items: flex-end;
          margin-bottom: 30px; border-bottom: 1px solid var(--border);
          padding-bottom: 20px;
        }
        .title h1 { font-size: 28px; font-weight: 700; margin: 0 0 5px; color: var(--text-main); }
        .title p { color: var(--text-sub); font-size: 14px; margin: 0; }

        /* --- STATS CARDS --- */
        .stats-row {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px; margin-bottom: 40px;
        }
        .stat-card {
          background: var(--bg-card); border: 1px solid var(--border);
          padding: 20px; border-radius: 16px;
          display: flex; align-items: center; gap: 15px;
        }
        .stat-icon {
          width: 48px; height: 48px; border-radius: 12px;
          background: var(--primary-dim); color: var(--primary);
          display: flex; align-items: center; justify-content: center;
        }
        .stat-info h4 { font-size: 12px; color: var(--text-sub); text-transform: uppercase; margin: 0 0 4px; }
        .stat-info p { font-size: 20px; font-weight: 700; margin: 0; color: var(--text-main); }

        /* --- TABLE SECTION --- */
        .table-container {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        .custom-table { width: 100%; border-collapse: collapse; }
        
        .custom-table th {
          background: var(--bg-input);
          padding: 16px 24px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-sub);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--border);
        }

        .custom-table td {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
          color: var(--text-main);
          vertical-align: middle;
        }
        .custom-table tr:last-child td { border-bottom: none; }
        .custom-table tr:hover { background: rgba(255,255,255,0.02); }

        /* Columns */
        .col-id { font-family: monospace; color: var(--text-sub); font-size: 13px; }
        .col-plan { font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .col-amount { font-weight: 700; }
        
        .status-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 50px;
          font-size: 12px; font-weight: 600;
        }
        .status-success { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .status-failed { background: rgba(239, 68, 68, 0.1); color: var(--danger); }

        /* Action Button */
        .btn-download {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 16px; border-radius: 8px;
          background: transparent; border: 1px solid var(--border);
          color: var(--text-main); font-size: 13px; font-weight: 500;
          cursor: pointer; transition: 0.2s;
        }
        .btn-download:hover { border-color: var(--primary); color: var(--primary); background: var(--bg-input); }
        .btn-download:disabled { opacity: 0.5; cursor: wait; }

        /* --- PAGINATION --- */
        .pagination {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px; background: var(--bg-input);
          border-top: 1px solid var(--border);
        }
        .page-info { font-size: 13px; color: var(--text-sub); }
        .page-controls { display: flex; gap: 10px; }
        .page-btn {
          padding: 8px 14px; border: 1px solid var(--border);
          border-radius: 8px; background: var(--bg-card);
          color: var(--text-main); cursor: pointer; transition: 0.2s;
          display: flex; align-items: center;
        }
        .page-btn:hover:not(:disabled) { border-color: var(--text-sub); }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Empty State */
        .empty-state { text-align: center; padding: 60px; color: var(--text-sub); }

        @media (max-width: 768px) {
          .page-header { flex-direction: column; align-items: flex-start; gap: 15px; }
          .custom-table th, .custom-table td { padding: 12px 15px; }
          .hide-mobile { display: none; }
        }
      `}</style>

      <div className="container-xl">
        
        {/* HEADER */}
        <div className="page-header">
          <div className="title">
            <h1>Billing History</h1>
            <p>View all your past transactions and download invoices.</p>
          </div>
          {/* Optional: Add Date Filter here if needed */}
        </div>

        {/* SUMMARY STATS (Optional - can be derived from props or API) */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon"><FileText size={24}/></div>
            <div className="stat-info">
              <h4>Total Invoices</h4>
              <p>{payments.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><CheckCircle2 size={24}/></div>
            <div className="stat-info">
              <h4>Active Plan</h4>
              <p style={{textTransform:'capitalize'}}>{user?.user?.plan || "Free"}</p>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <Loader2 className="spin" size={32} style={{marginBottom:10}}/>
              <p>Loading records...</p>
            </div>
          ) : payments.length > 0 ? (
            <>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Plan / Item</th>
                    <th className="hide-mobile">Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th style={{textAlign:'right'}}>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                      <td className="col-id">#{payment.razorpay_payment_id.slice(-8).toUpperCase()}</td>
                      <td>
                        <div className="col-plan">
                          {payment.planName}
                        </div>
                      </td>
                      <td className="hide-mobile">
                        <div style={{display:'flex', alignItems:'center', gap:6, color:'var(--text-sub)'}}>
                          <Calendar size={14}/>
                          {new Date(payment.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="col-amount">₹{payment.amount}</td>
                      <td>
                        <span className={`status-badge ${payment.status === 'success' ? 'status-success' : 'status-failed'}`}>
                          {payment.status === 'success' ? 'Paid' : 'Failed'}
                        </span>
                      </td>
                      <td style={{textAlign:'right'}}>
                        <button 
                          className="btn-download"
                          onClick={() => handleDownload(payment.razorpay_payment_id)}
                          disabled={downloadingId === payment.razorpay_payment_id}
                        >
                          {downloadingId === payment.razorpay_payment_id ? (
                            <Loader2 size={16} className="spin"/>
                          ) : (
                            <Download size={16}/>
                          )}
                          <span className="hide-mobile">Download</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PAGINATION */}
              <div className="pagination">
                <span className="page-info">
                  Showing Page {currentPage} of {totalPages}
                </span>
                <div className="page-controls">
                  <button 
                    className="page-btn" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16}/> Prev
                  </button>
                  <button 
                    className="page-btn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next <ChevronRight size={16}/>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <FileText size={48} style={{opacity:0.2, marginBottom:15}}/>
              <p>No payment history found.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BillingHistory;