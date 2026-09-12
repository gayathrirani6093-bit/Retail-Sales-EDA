# Retail Sales Exploratory Data Analysis (EDA)

## 📊 Project Overview

This project focuses on Exploratory Data Analysis (EDA) of a retail sales dataset containing 1,000 transactions.

The objective is to analyze sales performance, customer demographics, product categories, quantities, pricing, and total revenue using Python and data visualization techniques.

## 🎯 Objectives

- Analyze overall retail sales performance
- Understand customer demographics
- Analyze sales across product categories
- Study purchasing quantities and prices
- Identify sales patterns and trends
- Generate meaningful business insights using data visualization

## 📁 Dataset

The dataset contains 1,000 retail transactions with the following attributes:

| Column | Description |
|---|---|
| Transaction ID | Unique ID for each transaction |
| Date | Date of the transaction |
| Customer ID | Unique customer identifier |
| Gender | Customer gender |
| Age | Customer age |
| Product Category | Category of purchased product |
| Quantity | Number of items purchased |
| Price per Unit | Price of one item |
| Total Amount | Total transaction amount |

## 🛠️ Technologies Used

- Python
- Pandas
- NumPy
- Matplotlib
- Seaborn
- Jupyter Notebook

## 🔍 Data Analysis

The following analysis was performed:

- Data loading and inspection
- Data cleaning
- Missing value analysis
- Statistical analysis
- Customer demographic analysis
- Product category analysis
- Quantity analysis
- Price analysis
- Total sales/revenue analysis
- Data visualization

## 📈 Dataset Summary

- **Total Transactions:** 1,000
- **Total Quantity Sold:** 2,514
- **Total Sales:** 419,750
- **Average Transaction Amount:** 419.75
- **Average Customer Age:** 41.23 years
- **Product Categories:** Clothing, Electronics, Beauty
- **Missing Values:** None

## 🛍️ Category-wise Sales

| Product Category | Transactions | Total Sales |
|---|---:|---:|
| Electronics | 331 | 144,750 |
| Clothing | 339 | 142,665 |
| Beauty | 330 | 132,335 |

Electronics generated the highest total sales among the three product categories.

## 👥 Gender Distribution

The dataset contains:

- **Female:** 529 transactions
- **Male:** 471 transactions

Female customers represent a slightly higher proportion of transactions in the dataset.

## 💡 Key Insights

- Electronics generated the highest overall sales.
- Clothing had the highest number of transactions.
- Female customers accounted for more transactions than male customers.
- The dataset contains 1,000 complete transactions with no missing values.
- Sales analysis can help identify customer and product-level purchasing patterns.

## 📊 Visualizations

The project includes visualizations such as:

- Sales by Product Category
- Gender Distribution
- Age Distribution
- Quantity Distribution
- Price per Unit Analysis
- Total Sales Analysis
- Sales Trends Over Time

## 🚀 How to Run the Project

1. Clone or download this repository.
2. Open the Jupyter Notebook.
3. Install the required Python libraries.
4. Place the dataset in the project folder.
5. Run the notebook cells to reproduce the analysis.

## 📂 Project Structure

```text
Retail-Sales-EDA/
│
├── retail_sales_processed_1000rows.csv
├── Retail_Sales_EDA.ipynb
└── README.md
