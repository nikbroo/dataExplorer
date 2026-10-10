import { Navigate, Route, Routes } from "react-router-dom";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPanel from "./pages/OrderDetailPanel";

const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/orders" replace />} />
    <Route path="/orders" element={<OrdersPage />}>
      <Route path=":id" element={<OrderDetailPanel />} />
    </Route>
    <Route path="*" element={<Navigate to="/orders" replace />} />
  </Routes>
);

export default App;
