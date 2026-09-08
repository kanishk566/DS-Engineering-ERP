import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getCustomers,
  getProducts,
  getVendors,
  getProjects,
  getPurchaseOrders,
  getQuotations,
  getSalesOrders,
  getInvoices,
} from "../../services/api";

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    customers: 0,
    products: 0,
    vendors: 0,
    projects: 0,
    purchaseOrders: 0,
    quotations: 0,
    salesOrders: 0,
    invoices: 0,
  });

  const [financials, setFinancials] = useState({
    invoiceTotal: 0,
    paidAmount: 0,
    outstandingAmount: 0,
    partialInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
  });

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTransactionMenu, setShowTransactionMenu] = useState(false);
  const [period, setPeriod] = useState("This Month");

  const normalizeList = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    return [];
  };

  const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });
  };

  const formatTimeAgo = (dateValue) => {
    if (!dateValue) return "Recently";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Recently";

    const difference = Math.max(0, Date.now() - date.getTime());
    const minutes = Math.floor(difference / (1000 * 60));
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

    return date.toLocaleDateString("en-IN");
  };

  const getDocumentNumber = (item, fields = []) => {
    for (const field of fields) {
      if (item?.[field]) return item[field];
    }
    return `#${item?.id ?? ""}`;
  };

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          customersResponse,
          productsResponse,
          vendorsResponse,
          projectsResponse,
          purchaseOrdersResponse,
          quotationsResponse,
          salesOrdersResponse,
          invoicesResponse,
        ] = await Promise.all([
          getCustomers(),
          getProducts(),
          getVendors(),
          getProjects(),
          getPurchaseOrders(),
          getQuotations(),
          getSalesOrders(),
          getInvoices(),
        ]);

        if (!mounted) return;

        const customers = normalizeList(customersResponse);
        const products = normalizeList(productsResponse);
        const vendors = normalizeList(vendorsResponse);
        const projects = normalizeList(projectsResponse);
        const purchaseOrders = normalizeList(purchaseOrdersResponse);
        const quotations = normalizeList(quotationsResponse);
        const salesOrders = normalizeList(salesOrdersResponse);
        const invoices = normalizeList(invoicesResponse);

        setStats({
          customers: customers.length,
          products: products.length,
          vendors: vendors.length,
          projects: projects.length,
          purchaseOrders: purchaseOrders.length,
          quotations: quotations.length,
          salesOrders: salesOrders.length,
          invoices: invoices.length,
        });

        let invoiceTotal = 0;
        let paidAmount = 0;
        let outstandingAmount = 0;
        let partialInvoices = 0;
        let paidInvoices = 0;
        let overdueInvoices = 0;

        invoices.forEach((invoice) => {
          const total = Number(invoice.totalAmount || 0);
          const paid = Number(invoice.paidAmount || 0);
          const balance = Math.max(total - paid, 0);

          invoiceTotal += total;
          paidAmount += paid;
          outstandingAmount += balance;

          if (invoice.status === "partial") partialInvoices += 1;
          if (invoice.status === "paid") paidInvoices += 1;
          if (invoice.status === "overdue") overdueInvoices += 1;
        });

        setFinancials({
          invoiceTotal,
          paidAmount,
          outstandingAmount,
          partialInvoices,
          paidInvoices,
          overdueInvoices,
        });

        const recentActivities = [];

        quotations.forEach((quotation) => {
          recentActivities.push({
            type: "quotation",
            icon: "▤",
            color: "blue",
            title: "Quotation created",
            description: getDocumentNumber(quotation, [
              "quotationNumber",
              "quoteNumber",
              "number",
            ]),
            date:
              quotation.createdAt ||
              quotation.updatedAt ||
              quotation.quotationDate,
          });
        });

        projects.forEach((project) => {
          recentActivities.push({
            type: "project",
            icon: "▰",
            color: "pink",
            title: "Project updated",
            description:
              project.projectName ||
              project.name ||
              getDocumentNumber(project),
            date: project.updatedAt || project.createdAt,
          });
        });

        purchaseOrders.forEach((purchaseOrder) => {
          recentActivities.push({
            type: "purchase-order",
            icon: "🛒",
            color: "orange",
            title: "Purchase order created",
            description: getDocumentNumber(purchaseOrder, [
              "poNumber",
              "purchaseOrderNumber",
              "orderNumber",
              "number",
            ]),
            date:
              purchaseOrder.createdAt ||
              purchaseOrder.updatedAt ||
              purchaseOrder.orderDate,
          });
        });

        salesOrders.forEach((salesOrder) => {
          recentActivities.push({
            type: "sales-order",
            icon: "▣",
            color: "purple",
            title: "Sales order created",
            description: getDocumentNumber(salesOrder, [
              "salesOrderNumber",
              "soNumber",
              "orderNumber",
              "number",
            ]),
            date:
              salesOrder.createdAt ||
              salesOrder.updatedAt ||
              salesOrder.orderDate,
          });
        });

        invoices.forEach((invoice) => {
          recentActivities.push({
            type: "invoice",
            icon: "▤",
            color: "teal",
            title: "Invoice created",
            description: getDocumentNumber(invoice, [
              "invoiceNumber",
              "number",
            ]),
            date:
              invoice.createdAt ||
              invoice.updatedAt ||
              invoice.invoiceDate,
          });
        });

        recentActivities.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });

        setActivities(recentActivities.slice(0, 5));
      } catch (err) {
        console.error("Dashboard load error:", err);

        if (mounted) {
          setError(
            err?.message || "Dashboard data load nahi ho saka."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const paidPercentage =
    financials.invoiceTotal > 0
      ? Math.min(
          100,
          Math.round(
            (financials.paidAmount / financials.invoiceTotal) * 100
          )
        )
      : 0;

  const partialPercentage =
    stats.invoices > 0
      ? Math.round(
          (financials.partialInvoices / stats.invoices) * 100
        )
      : 0;

  const unpaidInvoices = Math.max(
    stats.invoices -
      financials.paidInvoices -
      financials.partialInvoices -
      financials.overdueInvoices,
    0
  );

  const invoiceStatus = useMemo(
    () => [
      {
        label: "Paid",
        value: financials.paidInvoices,
        percentage:
          stats.invoices > 0
            ? Math.round(
                (financials.paidInvoices / stats.invoices) * 100
              )
            : 0,
        className: "paid",
      },
      {
        label: "Partial",
        value: financials.partialInvoices,
        percentage: partialPercentage,
        className: "partial",
      },
      {
        label: "Overdue",
        value: financials.overdueInvoices,
        percentage:
          stats.invoices > 0
            ? Math.round(
                (financials.overdueInvoices / stats.invoices) * 100
              )
            : 0,
        className: "overdue",
      },
      {
        label: "Unpaid",
        value: unpaidInvoices,
        percentage:
          stats.invoices > 0
            ? Math.round((unpaidInvoices / stats.invoices) * 100)
            : 0,
        className: "unpaid",
      },
    ],
    [
      financials,
      stats.invoices,
      partialPercentage,
      unpaidInvoices,
    ]
  );

  const statCards = [
    {
      key: "customers",
      title: "Customers",
      value: stats.customers,
      description: "Total customers",
      icon: "♧",
      tone: "blue",
      path: "/customers",
    },
    {
      key: "products",
      title: "Products",
      value: stats.products,
      description: "Total products",
      icon: "▣",
      tone: "orange",
      path: "/products",
    },
    {
      key: "vendors",
      title: "Vendors",
      value: stats.vendors,
      description: "Total vendors",
      icon: "▥",
      tone: "purple",
      path: "/vendors",
    },
    {
      key: "projects",
      title: "Projects",
      value: stats.projects,
      description: "Total projects",
      icon: "▰",
      tone: "pink",
      path: "/projects",
    },
    {
      key: "purchaseOrders",
      title: "Purchase Orders",
      value: stats.purchaseOrders,
      description: "Total purchase orders",
      icon: "🛒",
      tone: "green",
      path: "/purchase-orders",
    },
    {
      key: "quotations",
      title: "Quotations",
      value: stats.quotations,
      description: "Total quotations",
      icon: "▤",
      tone: "blue",
      path: "/quotations",
    },
    {
      key: "salesOrders",
      title: "Sales Orders",
      value: stats.salesOrders,
      description: "Total sales orders",
      icon: "▣",
      tone: "orange",
      path: "/sales-orders",
    },
    {
      key: "invoices",
      title: "Invoices",
      value: stats.invoices,
      description: "Total invoices",
      icon: "▤",
      tone: "purple",
      path: "/invoices",
    },
  ];

  const goTo = (path) => {
    setShowTransactionMenu(false);
    navigate(path);
  };

  if (loading) {
    return (
      <div className="ds-dashboard">
        <DashboardStyles />
        <div className="ds-loading-screen">
          <div className="ds-loading-orb">DS</div>
          <strong>Loading dashboard...</strong>
          <span>Fetching your latest business data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-dashboard">
      <DashboardStyles />

      <header className="ds-dashboard-header">
        <div className="ds-welcome">
          <div className="ds-welcome-title">
            Welcome back, Admin! <span>👋</span>
          </div>
          <p>Here&apos;s what&apos;s happening with your business today.</p>
        </div>

        <div className="ds-header-right">
          <div className="ds-date-box">
            <div className="ds-calendar-icon">▣</div>
            <div>
              <strong>
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </strong>
              <span>Let&apos;s make it a productive day!</span>
            </div>
          </div>

          <div className="ds-transaction-wrap">
            <button
              type="button"
              className="ds-new-transaction"
              onClick={() =>
                setShowTransactionMenu((previous) => !previous)
              }
            >
              <span className="plus">＋</span>
              New Transaction
              <span className="chevron">⌄</span>
            </button>

            {showTransactionMenu && (
              <div className="ds-transaction-menu">
                <button onClick={() => goTo("/sales-orders/new")}>
                  <span>▣</span> New Sales Order
                </button>
                <button onClick={() => goTo("/invoices/new")}>
                  <span>▤</span> Create Invoice
                </button>
                <button onClick={() => goTo("/purchase-orders/new")}>
                  <span>🛒</span> New Purchase Order
                </button>
                <button onClick={() => goTo("/quotations/new")}>
                  <span>▤</span> New Quotation
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="ds-error" role="alert">
          <span>!</span>
          {error}
        </div>
      )}

      <section className="ds-kpi-grid">
        {statCards.map((card, index) => (
          <button
            type="button"
            key={card.key}
            className={`ds-kpi-card ${card.tone}`}
            onClick={() => navigate(card.path)}
          >
            <div className="ds-kpi-top">
              <div className="ds-kpi-icon">{card.icon}</div>
              <span className="ds-kpi-growth">↑ +0%</span>
            </div>

            <div className="ds-kpi-title">{card.title}</div>
            <div className="ds-kpi-value">{card.value}</div>
            <div className="ds-kpi-bottom">
              <span>{card.description}</span>
              <MiniSpark index={index} />
            </div>
          </button>
        ))}
      </section>

      <section className="ds-main-grid">
        <div className="ds-financial-card">
          <div className="ds-section-head">
            <div className="ds-section-title-wrap">
              <div className="ds-section-icon blue">▥</div>
              <div>
                <h2>Financial Summary</h2>
                <p>Current invoice payment overview</p>
              </div>
            </div>

            <select
              className="ds-period-select"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            >
              <option>This Month</option>
              <option>This Quarter</option>
              <option>This Year</option>
            </select>
          </div>

          <div className="ds-financial-grid">
            <div className="ds-financial-box blue">
              <div className="ds-financial-icon">▤</div>
              <div className="ds-financial-label">Invoice Total</div>
              <strong>{formatCurrency(financials.invoiceTotal)}</strong>
              <span>{stats.invoices} total invoices</span>
            </div>

            <div className="ds-financial-box green">
              <div className="ds-financial-icon">▤</div>
              <div className="ds-financial-label">Paid Amount</div>
              <strong>{formatCurrency(financials.paidAmount)}</strong>
              <span>{financials.paidInvoices} paid invoices</span>
            </div>

            <div className="ds-financial-box orange">
              <div className="ds-financial-icon">◷</div>
              <div className="ds-financial-label">Outstanding</div>
              <strong>{formatCurrency(financials.outstandingAmount)}</strong>
              <span>{financials.partialInvoices} partial invoices</span>
            </div>

            <div className="ds-financial-box red">
              <div className="ds-financial-icon">!</div>
              <div className="ds-financial-label">Overdue</div>
              <strong>{financials.overdueInvoices}</strong>
              <span>Overdue invoices</span>
            </div>
          </div>
        </div>

        <div className="ds-growth-card">
          <div className="ds-growth-content">
            <div className="ds-growth-small">
              <span className="target-icon">◎</span>
              Business Growth
            </div>
            <h2>
              Keep Your
              <br />
              Business Moving
              <br />
              Forward <span>🚀</span>
            </h2>
            <p>
              “Efficient management
              <br />
              today, a stronger tomorrow.”
            </p>
          </div>

          <div className="ds-growth-chart">
            <div className="ds-growth-badge">↑ +32%</div>
            <div className="growth-bars">
              <span style={{ height: "35%" }} />
              <span style={{ height: "48%" }} />
              <span style={{ height: "66%" }} />
              <span style={{ height: "86%" }} />
            </div>
            <svg
              viewBox="0 0 260 130"
              preserveAspectRatio="none"
              className="growth-line"
            >
              <polyline
                points="5,111 55,88 110,96 162,62 215,44 255,10"
                fill="none"
                stroke="rgba(123,180,255,.95)"
                strokeWidth="3"
              />
              <circle cx="215" cy="44" r="5" fill="#fff" />
              <circle cx="255" cy="10" r="5" fill="#fff" />
            </svg>
          </div>
        </div>
      </section>

      <section className="ds-bottom-grid">
        <div className="ds-panel recent-panel">
          <div className="ds-section-head compact">
            <div className="ds-section-title-wrap">
              <div className="ds-section-icon purple">▤</div>
              <div>
                <h2>Recent Activity</h2>
                <p>Latest business activities</p>
              </div>
            </div>

            <button
              type="button"
              className="ds-view-all"
              onClick={() => navigate("/quotations")}
            >
              View All
            </button>
          </div>

          <div className="ds-activity-list">
            {activities.length === 0 ? (
              <div className="ds-empty">
                No recent activity found.
              </div>
            ) : (
              activities.map((activity, index) => (
                <div
                  className="ds-activity-row"
                  key={`${activity.type}-${index}`}
                >
                  <div className={`ds-activity-icon ${activity.color}`}>
                    {activity.icon}
                  </div>

                  <div className="ds-activity-content">
                    <strong>{activity.title}</strong>
                    <span>{activity.description}</span>
                  </div>

                  <time>{formatTimeAgo(activity.date)}</time>
                  <span className="ds-activity-dot" />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="ds-panel invoice-status-panel">
          <div className="ds-section-head compact">
            <div className="ds-section-title-wrap">
              <div className="ds-section-icon blue">▥</div>
              <div>
                <h2>Invoice Status</h2>
              </div>
            </div>

            <select
              className="ds-period-select small"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            >
              <option>This Month</option>
              <option>This Quarter</option>
              <option>This Year</option>
            </select>
          </div>

          <div className="ds-invoice-status-body">
            <div
              className="ds-donut"
              style={{
                background: `conic-gradient(
                  #3b82f6 0 ${financials.paidInvoices > 0 ? Math.max(paidPercentage, 4) : 0}%,
                  #a78bfa ${financials.paidInvoices > 0 ? Math.max(paidPercentage, 4) : 0}% ${Math.max(paidPercentage + partialPercentage, 0)}%,
                  #fb7185 ${Math.max(paidPercentage + partialPercentage, 0)}% ${Math.max(paidPercentage + partialPercentage + (stats.invoices ? (financials.overdueInvoices / stats.invoices) * 100 : 0), 0)}%,
                  #cbd5e1 ${Math.max(paidPercentage + partialPercentage + (stats.invoices ? (financials.overdueInvoices / stats.invoices) * 100 : 0), 0)}% 100%
                )`,
              }}
            >
              <div className="ds-donut-inner">
                <strong>{stats.invoices}</strong>
                <span>Invoices</span>
              </div>
            </div>

            <div className="ds-status-list">
              {invoiceStatus.map((item) => (
                <div className="ds-status-row" key={item.label}>
                  <span className={`ds-status-dot ${item.className}`} />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <em>({item.percentage}%)</em>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="ds-panel-link"
            onClick={() => navigate("/invoices")}
          >
            Open Invoice Management →
          </button>
        </div>

        <div className="ds-panel quick-panel">
          <div className="ds-section-head compact">
            <div className="ds-section-title-wrap">
              <div className="ds-section-icon yellow">ϟ</div>
              <div>
                <h2>Quick Actions</h2>
                <p>Common tasks</p>
              </div>
            </div>
          </div>

          <div className="ds-quick-grid">
            <button
              type="button"
              className="ds-quick blue"
              onClick={() => navigate("/customers/new")}
            >
              <span>＋</span>
              <strong>New Customer</strong>
            </button>

            <button
              type="button"
              className="ds-quick orange"
              onClick={() => navigate("/products/new")}
            >
              <span>▣</span>
              <strong>Add Product</strong>
            </button>

            <button
              type="button"
              className="ds-quick green"
              onClick={() => navigate("/invoices/new")}
            >
              <span>▤</span>
              <strong>Create Invoice</strong>
            </button>

            <button
              type="button"
              className="ds-quick purple"
              onClick={() => navigate("/purchase-orders/new")}
            >
              <span>🛒</span>
              <strong>New Purchase Order</strong>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniSpark({ index }) {
  const paths = [
    "M2 30 C14 27, 16 30, 28 22 S43 23, 52 15 S68 17, 78 7",
    "M2 31 C12 28, 19 29, 28 24 S42 25, 52 16 S65 15, 78 8",
    "M2 30 C12 29, 20 24, 29 26 S45 19, 52 17 S66 13, 78 5",
    "M2 31 C12 28, 21 29, 30 20 S45 22, 54 13 S66 14, 78 6",
    "M2 31 C12 30, 17 23, 28 24 S42 19, 52 17 S65 10, 78 7",
    "M2 31 C12 28, 20 26, 29 22 S43 25, 53 15 S67 14, 78 4",
    "M2 31 C14 29, 17 24, 29 25 S42 15, 53 17 S65 9, 78 5",
    "M2 31 C13 29, 20 26, 28 21 S43 23, 53 14 S66 15, 78 5",
  ];

  return (
    <svg
      className="ds-mini-spark"
      viewBox="0 0 80 34"
      aria-hidden="true"
    >
      <path
        d={paths[index % paths.length]}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DashboardStyles() {
  return (
    <style>{`
      .ds-dashboard,
      .ds-dashboard * {
        box-sizing: border-box;
      }

      .ds-dashboard {
        --navy: #071a41;
        --navy-2: #0b2455;
        --text: #0d1935;
        --muted: #6c7b99;
        --line: #e6ebf3;
        --page: #f5f8fc;
        width: 100%;
        min-height: calc(100vh - 0px);
        padding: 28px 30px 38px;
        background:
          radial-gradient(circle at 78% 2%, rgba(96, 165, 250, .08), transparent 25%),
          linear-gradient(180deg, #f8fbff 0%, #f4f7fb 100%);
        color: var(--text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .ds-dashboard button,
      .ds-dashboard select {
        font: inherit;
      }

      .ds-dashboard button {
        border: 0;
      }

      .ds-dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 24px;
        margin-bottom: 24px;
      }

      .ds-welcome-title {
        font-size: clamp(28px, 3vw, 37px);
        line-height: 1.08;
        font-weight: 800;
        letter-spacing: -1.3px;
      }

      .ds-welcome-title span {
        font-size: .8em;
      }

      .ds-welcome p {
        margin: 7px 0 0;
        color: #71809d;
        font-size: 16px;
      }

      .ds-header-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .ds-date-box {
        display: flex;
        align-items: center;
        gap: 11px;
        min-width: 270px;
      }

      .ds-calendar-icon {
        width: 39px;
        height: 39px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        color: #214ed0;
        background: #eef4ff;
        font-size: 19px;
      }

      .ds-date-box strong,
      .ds-date-box span {
        display: block;
      }

      .ds-date-box strong {
        color: #50617f;
        font-size: 14px;
        font-weight: 600;
      }

      .ds-date-box span {
        margin-top: 3px;
        color: #8995aa;
        font-size: 12px;
      }

      .ds-transaction-wrap {
        position: relative;
      }

      .ds-new-transaction {
        height: 42px;
        padding: 0 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: #fff;
        border-radius: 12px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 700;
        background: linear-gradient(100deg, #4f46e5, #1677ed);
        box-shadow: 0 10px 25px rgba(45, 85, 220, .2);
      }

      .ds-new-transaction .plus {
        font-size: 18px;
        line-height: 1;
      }

      .ds-new-transaction .chevron {
        margin-left: 8px;
        font-size: 16px;
      }

      .ds-transaction-menu {
        position: absolute;
        z-index: 30;
        top: calc(100% + 8px);
        right: 0;
        width: 220px;
        padding: 7px;
        border: 1px solid #e4eaf4;
        border-radius: 13px;
        background: #fff;
        box-shadow: 0 18px 40px rgba(16, 33, 67, .16);
      }

      .ds-transaction-menu button {
        width: 100%;
        padding: 10px 11px;
        display: flex;
        align-items: center;
        gap: 9px;
        border-radius: 9px;
        background: transparent;
        color: #233353;
        text-align: left;
        cursor: pointer;
        font-size: 13px;
      }

      .ds-transaction-menu button:hover {
        background: #f3f6ff;
      }

      .ds-error {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 15px;
        margin-bottom: 18px;
        border: 1px solid #ffd3d9;
        border-radius: 12px;
        color: #a91d34;
        background: #fff5f6;
        font-size: 13px;
      }

      .ds-error span {
        width: 22px;
        height: 22px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        color: #fff;
        background: #ef476f;
        font-weight: 800;
      }

      .ds-kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 15px;
        margin-bottom: 16px;
      }

      .ds-kpi-card {
        min-width: 0;
        min-height: 137px;
        padding: 15px 16px 13px;
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(226, 231, 241, .92);
        border-radius: 16px;
        text-align: left;
        cursor: pointer;
        background: #fff;
        box-shadow: 0 7px 18px rgba(29, 53, 92, .055);
        transition: transform .18s ease, box-shadow .18s ease;
      }

      .ds-kpi-card::after {
        content: "";
        position: absolute;
        width: 105px;
        height: 105px;
        right: -45px;
        bottom: -55px;
        border-radius: 50%;
        background: currentColor;
        opacity: .045;
      }

      .ds-kpi-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 13px 27px rgba(29, 53, 92, .1);
      }

      .ds-kpi-card.blue { color: #2377ef; }
      .ds-kpi-card.orange { color: #f19a38; }
      .ds-kpi-card.purple { color: #7c5ce7; }
      .ds-kpi-card.pink { color: #ed5e8a; }
      .ds-kpi-card.green { color: #2fc598; }

      .ds-kpi-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .ds-kpi-icon {
        width: 45px;
        height: 45px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        font-size: 21px;
        background: currentColor;
        color: #fff;
        box-shadow: 0 8px 17px rgba(36, 101, 220, .12);
      }

      .ds-kpi-card.orange .ds-kpi-icon { background: #ffdcae; color: #ed8c20; }
      .ds-kpi-card.purple .ds-kpi-icon { background: #e7ddff; color: #7655df; }
      .ds-kpi-card.pink .ds-kpi-icon { background: #ffdce8; color: #ed5d88; }
      .ds-kpi-card.green .ds-kpi-icon { background: #d7f8ed; color: #20ad82; }
      .ds-kpi-card.blue .ds-kpi-icon { background: #d9eaff; color: #176fe4; }

      .ds-kpi-growth {
        padding-top: 3px;
        color: #0fa66c;
        font-size: 11px;
        font-weight: 800;
      }

      .ds-kpi-title {
        margin-top: 8px;
        color: #40506f;
        font-size: 13px;
        font-weight: 650;
      }

      .ds-kpi-value {
        margin-top: 3px;
        color: #07132e;
        font-size: 28px;
        line-height: 1;
        font-weight: 800;
        letter-spacing: -.7px;
      }

      .ds-kpi-bottom {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 6px;
        margin-top: 4px;
      }

      .ds-kpi-bottom > span {
        color: #7887a5;
        font-size: 11px;
      }

      .ds-mini-spark {
        width: 83px;
        height: 34px;
        margin-right: -5px;
        margin-bottom: -3px;
        opacity: .82;
      }

      .ds-main-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.8fr) minmax(340px, .95fr);
        gap: 16px;
        margin-top: 16px;
      }

      .ds-financial-card,
      .ds-panel {
        border: 1px solid #e4e9f1;
        border-radius: 17px;
        background: rgba(255,255,255,.97);
        box-shadow: 0 7px 20px rgba(26, 48, 82, .045);
      }

      .ds-financial-card {
        padding: 18px 16px;
      }

      .ds-section-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
        margin-bottom: 15px;
      }

      .ds-section-head.compact {
        margin-bottom: 12px;
      }

      .ds-section-title-wrap {
        display: flex;
        align-items: center;
        gap: 11px;
      }

      .ds-section-icon {
        width: 37px;
        height: 37px;
        display: grid;
        place-items: center;
        flex: 0 0 37px;
        border-radius: 10px;
        font-size: 17px;
        font-weight: 700;
      }

      .ds-section-icon.blue {
        color: #176fe4;
        background: #e1edff;
      }

      .ds-section-icon.purple {
        color: #7655df;
        background: #ece5ff;
      }

      .ds-section-icon.yellow {
        color: #e79a00;
        background: #fff0cc;
      }

      .ds-section-head h2 {
        margin: 0;
        color: #101b35;
        font-size: 16px;
        font-weight: 800;
        letter-spacing: -.2px;
      }

      .ds-section-head p {
        margin: 3px 0 0;
        color: #8290aa;
        font-size: 11px;
      }

      .ds-period-select {
        height: 37px;
        min-width: 120px;
        padding: 0 11px;
        border: 1px solid #e3e9f2;
        border-radius: 10px;
        outline: none;
        color: #42516e;
        background: #fff;
        font-size: 12px;
        cursor: pointer;
      }

      .ds-period-select.small {
        min-width: 112px;
        height: 35px;
      }

      .ds-financial-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .ds-financial-box {
        min-height: 125px;
        padding: 13px;
        border-radius: 13px;
        position: relative;
        overflow: hidden;
      }

      .ds-financial-box.blue { background: linear-gradient(145deg, #e6f0ff, #d9eaff); }
      .ds-financial-box.green { background: linear-gradient(145deg, #e4faf1, #d9f7eb); }
      .ds-financial-box.orange { background: linear-gradient(145deg, #fff1df, #ffebd5); }
      .ds-financial-box.red { background: linear-gradient(145deg, #ffebee, #ffe4e8); }

      .ds-financial-icon {
        width: 33px;
        height: 33px;
        display: grid;
        place-items: center;
        margin-bottom: 8px;
        border-radius: 9px;
        color: #fff;
        background: rgba(30, 111, 231, .9);
        font-weight: 800;
      }

      .ds-financial-box.green .ds-financial-icon { background: #2bc18f; }
      .ds-financial-box.orange .ds-financial-icon { background: #ff9c27; }
      .ds-financial-box.red .ds-financial-icon { background: #ef476f; }

      .ds-financial-label {
        color: #42516e;
        font-size: 11px;
        font-weight: 700;
      }

      .ds-financial-box strong {
        display: block;
        margin-top: 5px;
        color: #13244a;
        font-size: clamp(17px, 1.65vw, 23px);
        line-height: 1.15;
        letter-spacing: -.6px;
      }

      .ds-financial-box.green strong { color: #08754e; }
      .ds-financial-box.orange strong { color: #c75b00; }
      .ds-financial-box.red strong { color: #ad243f; }

      .ds-financial-box > span {
        display: block;
        margin-top: 6px;
        color: #75839e;
        font-size: 10px;
      }

      .ds-growth-card {
        min-height: 225px;
        padding: 20px 19px;
        position: relative;
        overflow: hidden;
        display: flex;
        justify-content: space-between;
        border-radius: 17px;
        color: #fff;
        background:
          radial-gradient(circle at 78% 76%, rgba(50, 128, 255, .3), transparent 30%),
          linear-gradient(135deg, #10275b 0%, #081a45 100%);
        box-shadow: 0 12px 25px rgba(9, 29, 71, .13);
      }

      .ds-growth-small {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #b8c8e8;
        font-size: 12px;
      }

      .target-icon {
        width: 28px;
        height: 28px;
        display: grid;
        place-items: center;
        border-radius: 9px;
        color: #fff;
        background: rgba(255,255,255,.11);
        font-size: 17px;
      }

      .ds-growth-content h2 {
        margin: 15px 0 10px;
        font-size: clamp(24px, 2.25vw, 32px);
        line-height: 1.08;
        letter-spacing: -.9px;
      }

      .ds-growth-content p {
        margin: 0;
        color: #b8c5dc;
        font-size: 11px;
        line-height: 1.5;
      }

      .ds-growth-chart {
        width: 53%;
        min-width: 190px;
        align-self: stretch;
        position: relative;
      }

      .ds-growth-badge {
        position: absolute;
        z-index: 3;
        top: 30px;
        right: 2px;
        padding: 7px 10px;
        border-radius: 8px;
        color: #fff;
        background: #217af2;
        box-shadow: 0 8px 15px rgba(24, 117, 240, .25);
        font-size: 11px;
        font-weight: 800;
      }

      .growth-bars {
        height: 135px;
        position: absolute;
        left: 35px;
        right: 0;
        bottom: 0;
        display: flex;
        justify-content: flex-end;
        align-items: flex-end;
        gap: 12px;
        opacity: .82;
      }

      .growth-bars span {
        width: 23px;
        border-radius: 5px 5px 2px 2px;
        background: linear-gradient(180deg, #42b8ff, #1d65e4);
      }

      .growth-bars span:nth-child(2) {
        background: linear-gradient(180deg, #2ad7ef, #1774e8);
      }

      .growth-bars span:nth-child(3) {
        background: linear-gradient(180deg, #51cfff, #1c76e7);
      }

      .growth-bars span:nth-child(4) {
        background: linear-gradient(180deg, #c183ff, #754de4);
      }

      .growth-line {
        position: absolute;
        left: 15px;
        right: 0;
        bottom: 0;
        width: calc(100% - 5px);
        height: 140px;
        z-index: 2;
      }

      .ds-bottom-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(300px, .88fr) minmax(245px, .64fr);
        gap: 16px;
        margin-top: 16px;
      }

      .ds-panel {
        padding: 17px 15px;
        min-width: 0;
      }

      .ds-view-all {
        padding: 8px 11px;
        border-radius: 9px;
        color: #1f68dc;
        background: #edf4ff;
        cursor: pointer;
        font-size: 11px;
        font-weight: 700;
      }

      .ds-activity-list {
        border-top: 1px solid #edf0f5;
      }

      .ds-activity-row {
        min-height: 52px;
        display: grid;
        grid-template-columns: 37px minmax(0, 1fr) auto 7px;
        align-items: center;
        gap: 10px;
        border-bottom: 1px solid #edf0f5;
      }

      .ds-activity-icon {
        width: 33px;
        height: 33px;
        display: grid;
        place-items: center;
        border-radius: 9px;
        font-size: 15px;
      }

      .ds-activity-icon.blue { color: #246edc; background: #e5f0ff; }
      .ds-activity-icon.green { color: #1fa57b; background: #e1f8ef; }
      .ds-activity-icon.orange { color: #dc7c12; background: #fff0dc; }
      .ds-activity-icon.purple { color: #7656dc; background: #eee8ff; }
      .ds-activity-icon.teal { color: #159c91; background: #def8f3; }
      .ds-activity-icon.pink { color: #e44f7d; background: #ffe5ed; }

      .ds-activity-content {
        min-width: 0;
      }

      .ds-activity-content strong,
      .ds-activity-content span {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ds-activity-content strong {
        color: #263553;
        font-size: 12px;
      }

      .ds-activity-content span {
        margin-top: 2px;
        color: #71809d;
        font-size: 11px;
      }

      .ds-activity-row time {
        color: #7b89a2;
        white-space: nowrap;
        font-size: 10px;
      }

      .ds-activity-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #2c78ec;
      }

      .ds-invoice-status-body {
        min-height: 178px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 22px;
      }

      .ds-donut {
        width: 138px;
        height: 138px;
        flex: 0 0 138px;
        display: grid;
        place-items: center;
        border-radius: 50%;
      }

      .ds-donut-inner {
        width: 93px;
        height: 93px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        border-radius: 50%;
        background: #fff;
        box-shadow: inset 0 0 0 1px #f0f2f6;
      }

      .ds-donut-inner strong {
        color: #152341;
        font-size: 24px;
      }

      .ds-donut-inner span {
        color: #7d8aa3;
        font-size: 10px;
      }

      .ds-status-list {
        flex: 1;
        min-width: 130px;
      }

      .ds-status-row {
        display: grid;
        grid-template-columns: 8px minmax(45px, 1fr) auto auto;
        align-items: center;
        gap: 7px;
        min-height: 31px;
        color: #6f7e99;
        font-size: 11px;
      }

      .ds-status-row strong {
        color: #44516b;
        font-size: 11px;
      }

      .ds-status-row em {
        min-width: 34px;
        color: #65738d;
        font-style: normal;
        text-align: right;
        font-size: 10px;
      }

      .ds-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .ds-status-dot.paid { background: #36c995; }
      .ds-status-dot.partial { background: #3d82f5; }
      .ds-status-dot.overdue { background: #ef6a85; }
      .ds-status-dot.unpaid { background: #aeb8c7; }

      .ds-panel-link {
        width: 100%;
        padding-top: 10px;
        border-top: 1px solid #edf0f5 !important;
        color: #1e69d9;
        background: transparent;
        cursor: pointer;
        text-align: left;
        font-size: 11px;
        font-weight: 700;
      }

      .ds-quick-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .ds-quick {
        min-height: 91px;
        padding: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 7px;
        border-radius: 12px;
        cursor: pointer;
        transition: transform .15s ease;
      }

      .ds-quick:hover {
        transform: translateY(-2px);
      }

      .ds-quick span {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 10px;
        font-size: 18px;
      }

      .ds-quick strong {
        color: #44516c;
        font-size: 10px;
        text-align: center;
      }

      .ds-quick.blue { background: #edf5ff; }
      .ds-quick.blue span { color: #176fe4; background: #d9eaff; }

      .ds-quick.orange { background: #fff4e8; }
      .ds-quick.orange span { color: #e78a1d; background: #ffe0b8; }

      .ds-quick.green { background: #eafaf4; }
      .ds-quick.green span { color: #16a578; background: #cff5e6; }

      .ds-quick.purple { background: #f3efff; }
      .ds-quick.purple span { color: #7352dd; background: #e3dbff; }

      .ds-empty {
        padding: 25px 8px;
        color: #8793aa;
        text-align: center;
        font-size: 12px;
      }

      .ds-loading-screen {
        min-height: 70vh;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 7px;
        color: #60708f;
      }

      .ds-loading-screen strong {
        color: #152341;
        font-size: 17px;
      }

      .ds-loading-screen span {
        font-size: 12px;
      }

      .ds-loading-orb {
        width: 58px;
        height: 58px;
        display: grid;
        place-items: center;
        margin-bottom: 7px;
        border-radius: 16px;
        color: #fff;
        background: linear-gradient(135deg, #1469ec, #6646e8);
        box-shadow: 0 15px 30px rgba(40, 90, 220, .2);
        font-weight: 900;
      }

      @media (max-width: 1250px) {
        .ds-kpi-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .ds-bottom-grid {
          grid-template-columns: 1.3fr 1fr;
        }

        .quick-panel {
          grid-column: 1 / -1;
        }

        .ds-quick-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }

      @media (max-width: 1050px) {
        .ds-dashboard {
          padding: 22px 20px 32px;
        }

        .ds-dashboard-header {
          align-items: flex-start;
          flex-direction: column;
        }

        .ds-header-right {
          width: 100%;
          justify-content: space-between;
        }

        .ds-main-grid {
          grid-template-columns: 1fr;
        }

        .ds-growth-card {
          min-height: 215px;
        }

        .ds-financial-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 780px) {
        .ds-kpi-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .ds-bottom-grid {
          grid-template-columns: 1fr;
        }

        .quick-panel {
          grid-column: auto;
        }

        .ds-quick-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .ds-date-box {
          min-width: 0;
        }
      }

      @media (max-width: 560px) {
        .ds-dashboard {
          padding: 17px 12px 25px;
        }

        .ds-welcome-title {
          font-size: 27px;
        }

        .ds-welcome p {
          font-size: 13px;
        }

        .ds-header-right {
          align-items: stretch;
          flex-direction: column;
        }

        .ds-date-box {
          width: 100%;
        }

        .ds-new-transaction {
          width: 100%;
          justify-content: center;
        }

        .ds-transaction-menu {
          left: 0;
          right: 0;
          width: 100%;
        }

        .ds-kpi-card {
          min-height: 132px;
          padding: 12px;
        }

        .ds-kpi-icon {
          width: 40px;
          height: 40px;
        }

        .ds-kpi-value {
          font-size: 24px;
        }

        .ds-financial-grid {
          grid-template-columns: 1fr;
        }

        .ds-section-head {
          align-items: flex-start;
        }

        .ds-growth-card {
          min-height: 260px;
        }

        .ds-growth-chart {
          position: absolute;
          width: 60%;
          height: 125px;
          right: 0;
          bottom: 5px;
          opacity: .75;
        }

        .ds-growth-content {
          position: relative;
          z-index: 4;
        }

        .ds-invoice-status-body {
          gap: 10px;
          flex-direction: column;
        }

        .ds-status-list {
          width: 100%;
        }

        .ds-activity-row {
          grid-template-columns: 35px minmax(0, 1fr) auto;
        }

        .ds-activity-dot {
          display: none;
        }

        .ds-quick-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `}</style>
  );
}

export default Dashboard;
