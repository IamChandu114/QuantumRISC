`timescale 1ns / 1ps

module hazard_detection_tb;

logic MemRead_EX;
logic [4:0] rd_EX;
logic [4:0] rs1_ID;
logic [4:0] rs2_ID;

logic stall;

hazard_detection_unit dut(.*);

initial begin

    $display("-------------------------------");
    $display("Hazard Detection Test");
    $display("-------------------------------");

    // Hazard
    MemRead_EX = 1;
    rd_EX = 5'd5;
    rs1_ID = 5'd5;
    rs2_ID = 5'd2;

    #10;

    if(stall)
        $display("[PASS] Hazard Detected");
    else
        $display("[FAIL] Hazard Missed");

    // No Hazard
    MemRead_EX = 1;
    rd_EX = 5'd7;
    rs1_ID = 5'd1;
    rs2_ID = 5'd2;

    #10;

    if(!stall)
        $display("[PASS] No Hazard");
    else
        $display("[FAIL] False Hazard");

    $display("-------------------------------");

    $finish;

end

endmodule
