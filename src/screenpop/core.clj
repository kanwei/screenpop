(ns screenpop.core
  (:require [org.httpkit.client :as http]
            [org.httpkit.server :as server]
            [clojure.edn :as edn]
            [compojure.core :refer :all]
            [ring.middleware.params :as param]
            [ring.middleware.json :as middleware-json]
            [cheshire.core :as json]
            [compojure.route :as route]
            [screenpop.cors :as cors]
            [clojure.tools.logging :refer [info error]]))

(defonce users (atom {}))
(defonce configs (edn/read-string (slurp (clojure.java.io/resource "config.clj"))))

(declare tourbuzz fullcontact)

(defn saveCustomerDataForInboundEvent [guid via data]
  (swap! users assoc-in [guid via] data))

(defroutes app-routes
  (GET "/" [] (slurp (clojure.java.io/resource "public/index.html")))
  (POST "/zendesk" {params :params}
        (let [zendesk-body (json/parse-string (params "message"))
              ticket-id (zendesk-body "ticketId")]
          (saveCustomerDataForInboundEvent (zendesk-body "ticketId") "zendesk" zendesk-body)
          (tourbuzz ticket-id {:userId (zendesk-body "userId") :email (zendesk-body "email")}))
        "OK")
  (POST "/twilio" {params :params}
        (saveCustomerDataForInboundEvent (params "CallGuid") "twilio" params)
        (tourbuzz {:phone (params "Caller")}
                  (fn [d]
                    (saveCustomerDataForInboundEvent (params "CallGuid") "tourbuzz" d)
                    (fullcontact (d "email")
                                 (fn [fd]
                                   (saveCustomerDataForInboundEvent (params "CallGuid") "fullcontact" fd)))))
        (slurp (clojure.java.io/resource "call.xml")))
  (GET "/data" [] {:body @users})
  (route/resources "/"))


(defn tourbuzz [m put-data-f]
  (http/get "http://staging.tourbuzz.net/public/api/screenpop/query"
              {:timeout 2000
               :query-params m}
            (fn [{:keys [status headers body error]}]
              (put-data-f (json/parse-string body)))))

(defn fullcontact [email put-data-f]
  (http/get "https://api.fullcontact.com/v2/person.json"
              {:timeout 2000
               :query-params {:email email
                              :apiKey (:fullcontact_api configs)}}
            (fn [{:keys [status headers body error]}]
              (put-data-f (json/parse-string body)))))

(def app (-> app-routes
             param/wrap-params
             middleware-json/wrap-json-body
             middleware-json/wrap-json-params
             middleware-json/wrap-json-response
             (cors/wrap-cors :access-control-allow-origin #".*"
                             :access-control-allow-headers ["Content-Type" "X-Requested-With"]
                             :access-control-allow-methods [:get :post :options])))

;(server/run-server app-routes {:port 9999})
