import React, { useState, useEffect } from "react";
import './Home.css';
import HorizontalScroll from "./HorizontalScroll";
import Modal from './Modal';


const Home = () => {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState([]);
  const [dataType, setDataType] = useState("COMBINED_DATA");
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadAssignment, setShowLeadAssignment] = useState(false); // State to track lead assignment view
  const [selectedTab, setSelectedTab] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', content: '' });


  // const [dataType, setDataType] = useState('');
  // const [selectedTab, setSelectedTab] = useState('');

  const handleClick = (type) => {
    setDataType(type);      // Set the dataType state
    setSelectedTab(type);   // Set the selectedTab state
  };

  // Define filter labels for each dataType
  // FDIC / NCUA / iBanknet
  const filterLabels = {
    COMBINED_DATA: {
      customerName: "CUSTOMER_NAME",
      address: "ADDRESS",
      certificateNumber: "CERTIFICATE_NUMBER",
      // industryType: "INDUSTRY_TYPE",
    },
    SNP_GLOBAL_DATA: {
      entityName: "ENTITY_NAME",
      entityId: "ENTITY_ID",
      // source: "Source",
      // industryType: "INDUSTRY_TYPE",
    },
    DNB_DATA: {
      businessName: "BUSINESS_NAME",
      streetAddress: "STREET_ADDRESS",
      dunsNumber: "DUNS_NUMBER",
      cityname: "CITY_NAME",
      industryType: "INDUSTRY_TYPE",
    },
  };

  // Update filters based on input
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  // Fetch data based on filters
  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...filters, dataType }),
      });

      const result = await response.json();
      console.log("Received data:", result); // Log the result received from the server
      setData(result);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();  // Fetch data when dataType or filters change
  }, [dataType, filters]);

  // Function to clear all filters and inputs
  const clearFilterHandler = () => {
    setFilters({}); // Reset filters to an empty object
  };

  // Function to handle "Lead Assignment" button click
  const leadAssgHandler = () => {
    setShowLeadAssignment((prevState) => !prevState); // Toggle between true and false
  };





  // Function to trigger Python script when button in Sr. No column is clicked
  const handleAssignLead = (rowData) => {
    fetch(`http://localhost:3001/api/assign-lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rowData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.team) {
          setModalContent({
            title: "Lead Assignment Completed",
            content: `Team: ${data.team}\nIndustry Type: ${data.industryType}\nTotal Assets: ${data.totalAssets}`,
          });
          setIsModalOpen(true);
        } else {
          setModalContent({ title: "Error", content: "Failed to fetch lead data" });
          setIsModalOpen(true);
        }
      })
      .catch((err) => {
        setModalContent({
          title: "Unexpected Error",
          content: `An unexpected error occurred: ${err.message || err}`,
        });
        setIsModalOpen(true);
      });
  };








  return (
    <div className="main-display">
      <div className="header">
        <img src="https://cdn.wolterskluwer.io/wk/fundamentals/1.15.2/logo/assets/medium.svg" className="logo" alt="Logo"></img>
        <h3 id="heading">SMART RESEARCH PORTAL</h3>
        <button className="lead-assg" onClick={leadAssgHandler}>
          {showLeadAssignment ? "Cancel Assignment" : "Assign Lead"}
        </button>
      </div>

      {/* Search Filters Section */}
      <div className="filter-section">
        {Object.keys(filterLabels[dataType]).map((filterKey) => (
          <div className="filter-card" key={filterKey}>
            <label>{filterLabels[dataType][filterKey]}</label>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search"
                name={filterKey}
                value={filters[filterKey] || ''}
                onChange={handleFilterChange}
              />
              <span className="search-icon" onClick={handleSearch}>
                🔍
              </span>
            </div>
          </div>
        ))}

        {/* Conditional Filters based on dataType */}
        {dataType === 'COMBINED_DATA' && (
          <>
            {/* Source Filter */}
            <div className="filter-card">
              <label>Source</label>
              <select
                name="source"
                value={filters.source || 'all'}
                onChange={handleFilterChange}
              >
                <option value="all">All</option>
                <option value="iBanknet">iBanknet</option>
                <option value="FDIC">FDIC</option>
                <option value="NCUA">NCUA</option>
              </select>
            </div>

            {/* INDUSTRY_TYPE Filter */}
            <div className="filter-card">
              <label>INDUSTRY_TYPE</label>
              <select
                name="industryType"
                value={filters.industryType || 'all'}
                onChange={handleFilterChange}
              >
                <option value="all">All</option>
                <option value="Credit Union">Credit Union</option>
                <option value="Savings bank">Savings bank</option>
                <option value="Commercial bank">Commercial bank</option>
                <option value="Holding Company">Holding Company</option>
                <option value="Securities broker and/or dealer">
                  Securities broker and/or dealer
                </option>
                <option value="Nondeposit trust company">
                  Nondeposit trust company
                </option>
                <option value="Insurance underwriting & insurance company">
                  Insurance underwriting & insurance company
                </option>
                <option value="State Stock Savings and Loans">
                  State Stock Savings and Loans
                </option>
              </select>
            </div>
          </>
        )}

        {dataType === 'SNP_GLOBAL_DATA' && (
          <>
            {/* INDUSTRY_TYPE Filter */}
            <div className="filter-card">
              <label>INDUSTRY_TYPE</label>
              <select
                name="industryType"
                value={filters.industryType || 'all'}
                onChange={handleFilterChange}
              >
                <option value="all">All</option>

                {/* Add more options as necessary */}
              </select>
            </div>
          </>
        )}

        {dataType === 'DNB_DATA' && (
          <>
            {/* City Name Filter */}
            <div className="filter-card">
              <label>SIC</label>
              <select
                name="sic"
                value={filters.sic || 'all'} // Bind to filters state
                onChange={handleFilterChange}
              >
                <option value="all">All</option>
                <option value="temp1">temp1</option>
                <option value="temp2">temp2</option>
              </select>
            </div>

          </>
        )}


      </div>

      {/* Data Tabs Section */}
      <div className="data-tabs">
        <button
          className={`data-tab ${selectedTab === 'COMBINED_DATA' ? 'selected' : ''}`}
          onClick={() => handleClick('COMBINED_DATA')}
        >
          FDIC / NCUA / iBanknet
        </button>
        <button
          className={`data-tab ${selectedTab === 'SNP_GLOBAL_DATA' ? 'selected' : ''}`}
          onClick={() => handleClick('SNP_GLOBAL_DATA')}
        >
          S&P GLOBAL Data
        </button>
        <button
          className={`data-tab ${selectedTab === 'DNB_DATA' ? 'selected' : ''}`}
          onClick={() => handleClick('DNB_DATA')}
        >
          Duns & Bradstreet Data
        </button>
        <div className="icons-section">
          <button className="clear-filter" onClick={clearFilterHandler}>Clear Filter</button>
        </div>
      </div>

      {/* Table Display Section */}
      <HorizontalScroll
        isLoading={isLoading}
        data={data}
        showLeadAssignment={showLeadAssignment}
        handleAssignLead={handleAssignLead} // Make sure this is passed down here
        dataType={dataType}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalContent.title}
        content={modalContent.content}
      />


    </div>
  );
};

export default Home;
