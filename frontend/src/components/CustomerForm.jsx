import { useState } from "react";
import { createCustomer } from "../services/api";

function CustomerForm({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        companyName: "",
        customerCode: "",
        email: "",
        phone: "",
        city: "",
        state: "",
        address: "",
        gstNumber: "",
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            const result = await createCustomer({
                ...formData,
                name: formData.companyName,
            });

            if (!result?.success) {
                throw new Error(
                    result?.message || "Failed to create customer",
                );
            }

            console.log(
                "Customer created successfully:",
                result,
            );

            if (onSuccess) {
                onSuccess(result);
            } else {
                onClose();
            }
        } catch (err) {
            console.error(
                "Failed to create customer:",
                err,
            );

            setError(
                err.message || "Failed to create customer",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="customer-form-overlay">
            <div className="customer-form-modal">

                {/* HEADER */}
                <div className="customer-form-header">
                    <div>
                        <h3>Add Customer</h3>

                        <p>
                            Enter customer business information.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="form-close-button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>


                {/* FORM */}
                <form
                    className="customer-form"
                    onSubmit={handleSubmit}
                >

                    <div className="form-section-title">
                        Basic Information
                    </div>


                    {/* ERROR */}
                    {error && (
                        <div
                            style={{
                                marginBottom: "18px",
                                padding: "12px 14px",
                                borderRadius: "9px",
                                border: "1px solid #fecaca",
                                background: "#fef2f2",
                                color: "#dc2626",
                                fontSize: "13px",
                                fontWeight: "600",
                            }}
                        >
                            {error}
                        </div>
                    )}


                    <div className="form-grid">

                        {/* COMPANY NAME */}
                        <div className="form-group">
                            <label htmlFor="companyName">
                                Company Name *
                            </label>

                            <input
                                id="companyName"
                                name="companyName"
                                type="text"
                                placeholder="Enter company name"
                                value={formData.companyName}
                                onChange={handleChange}
                                disabled={saving}
                                required
                            />
                        </div>


                        {/* CUSTOMER CODE */}
                        <div className="form-group">
                            <label htmlFor="customerCode">
                                Customer Code *
                            </label>

                            <input
                                id="customerCode"
                                name="customerCode"
                                type="text"
                                placeholder="e.g. CUST-002"
                                value={formData.customerCode}
                                onChange={handleChange}
                                disabled={saving}
                                required
                            />
                        </div>


                        {/* EMAIL */}
                        <div className="form-group">
                            <label htmlFor="email">
                                Email Address
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="customer@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={saving}
                            />
                        </div>


                        {/* PHONE */}
                        <div className="form-group">
                            <label htmlFor="phone">
                                Phone Number
                            </label>

                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="Enter phone number"
                                value={formData.phone}
                                onChange={handleChange}
                                disabled={saving}
                            />
                        </div>


                        {/* CITY */}
                        <div className="form-group">
                            <label htmlFor="city">
                                City
                            </label>

                            <input
                                id="city"
                                name="city"
                                type="text"
                                placeholder="Enter city"
                                value={formData.city}
                                onChange={handleChange}
                                disabled={saving}
                            />
                        </div>


                        {/* STATE */}
                        <div className="form-group">
                            <label htmlFor="state">
                                State
                            </label>

                            <input
                                id="state"
                                name="state"
                                type="text"
                                placeholder="Enter state"
                                value={formData.state}
                                onChange={handleChange}
                                disabled={saving}
                            />
                        </div>


                        {/* ADDRESS */}
                        <div className="form-group full-width">
                            <label htmlFor="address">
                                Address
                            </label>

                            <textarea
                                id="address"
                                name="address"
                                placeholder="Enter complete address"
                                value={formData.address}
                                onChange={handleChange}
                                disabled={saving}
                                rows="3"
                            />
                        </div>


                        {/* GST */}
                        <div className="form-group">
                            <label htmlFor="gstNumber">
                                GST Number
                            </label>

                            <input
                                id="gstNumber"
                                name="gstNumber"
                                type="text"
                                placeholder="Enter GST number"
                                value={formData.gstNumber}
                                onChange={handleChange}
                                disabled={saving}
                            />
                        </div>

                    </div>


                    {/* ACTIONS */}
                    <div className="customer-form-actions">

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : "Save Customer"}
                        </button>

                    </div>

                </form>

            </div>
        </div>
    );
}

export default CustomerForm;