import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react";
import { usePayStubs } from "@/hooks/usePayStubs";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const PayStubs = () => {
  const { payStubs, loading, markAsDownloaded } = usePayStubs();

  const groupedByYear = useMemo(() => {
    const groups: Record<number, typeof payStubs> = {};
    for (const stub of payStubs) {
      if (!groups[stub.period_year]) {
        groups[stub.period_year] = [];
      }
      groups[stub.period_year].push(stub);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, stubs]) => ({
        year: Number(year),
        stubs: stubs.sort((a, b) => b.period_month - a.period_month),
      }));
  }, [payStubs]);

  const handleDownload = async (stub: (typeof payStubs)[0]) => {
    await markAsDownloaded(stub.id);
    window.open(stub.file_url, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Mis Recibos de Sueldo
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Descargá tus recibos de sueldo mensuales
            </p>
          </div>
        </div>

        {payStubs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No hay recibos disponibles
              </h3>
              <p className="text-sm text-gray-400 max-w-sm">
                Cuando tu empleador suba tus recibos de sueldo, aparecerán aquí
                para que puedas descargarlos.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {groupedByYear.map(({ year, stubs }) => (
              <div key={year}>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">
                  {year}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {stubs.map((stub) => (
                    <Card
                      key={stub.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">
                                {MONTH_NAMES[stub.period_month - 1]}
                              </span>
                              {stub.downloaded_at ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-700 text-xs"
                                >
                                  Descargado
                                </Badge>
                              ) : (
                                <Badge className="bg-blue-100 text-blue-700 text-xs">
                                  Nuevo
                                </Badge>
                              )}
                            </div>
                            <p
                              className="text-sm text-gray-500 truncate"
                              title={stub.file_name}
                            >
                              {stub.file_name}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Subido el{" "}
                              {new Date(stub.created_at).toLocaleDateString(
                                "es-AR"
                              )}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(stub)}
                            className="shrink-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PayStubs;
