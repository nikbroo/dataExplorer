import moment from "moment";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

export const formatCurrency = (value: number) => currencyFormatter.format(value);

export const formatNumber = (value: number) => numberFormatter.format(value);

export const formatDate = (iso: string) => moment(iso).format("DD MMM YYYY, HH:mm");

export const formatRelative = (iso: string) => moment(iso).fromNow();

export const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
